import React, { useState, useEffect, useRef } from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import { Camera, Clock, MapPin, Signal, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

/**
 * LiveFeed Component with Frame Rate Limiting and Performance Metrics
 * 
 * Displays live camera feed from IoT devices with intelligent frame rate limiting,
 * FPS tracking, latency measurement, and performance warnings.
 * 
 * @param {Object} props
 * @param {string} props.deviceId - Device ID to display feed from
 * @param {boolean} props.autoSubscribe - Auto-subscribe on mount (default: true)
 * @param {number} props.maxFps - Maximum frames per second (default: 5)
 * @param {boolean} props.showMetrics - Show performance metrics overlay (default: true)
 * @param {boolean} props.sendMetrics - Send metrics back to server (default: false)
 */
const LiveFeed = ({ 
  deviceId, 
  autoSubscribe = true, 
  maxFps = 5,
  showMetrics = true,
  sendMetrics = false
}) => {
  const { isConnected, subscribe, unsubscribe, latestFrames, sendMessage } = useWebSocketContext();
  
  // State for displayed frame (rate-limited)
  const [displayedFrame, setDisplayedFrame] = useState(null);
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [audioVolume, setAudioVolume] = useState(1.0); // 0.0 to 1.0
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const gainNodeRef = useRef(null);
  
  // Performance metrics state
  const [metrics, setMetrics] = useState({
    currentFps: 0,
    averageLatency: 0,
    minLatency: Infinity,
    maxLatency: 0,
    totalFrames: 0,
    droppedFrames: 0
  });
  
  // Refs for frame tracking
  const lastFrameTimeRef = useRef(0);
  const frameTimestampsRef = useRef([]); // Rolling window of last 10 frame receive times
  const latencyWindowRef = useRef([]); // Rolling window of last 10 latencies
  const metricsIntervalRef = useRef(null);
  const lastMetricsSentRef = useRef(0);
  
  // Calculate minimum interval between frames (in milliseconds)
  const MIN_FRAME_INTERVAL = 1000 / maxFps; // Default: 200ms for 5 fps
  
  // Performance thresholds
  const FPS_WARNING_THRESHOLD = 3; // Show warning if FPS < 3
  const LATENCY_WARNING_THRESHOLD = 2000; // Show warning if latency > 2000ms
  const METRICS_SEND_INTERVAL = 5000; // Send metrics every 5 seconds
  
  /**
   * Calculate FPS from rolling window of frame timestamps
   */
  const calculateFPS = () => {
    const timestamps = frameTimestampsRef.current;
    if (timestamps.length < 2) return 0;
    
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    const fps = ((timestamps.length - 1) / timeSpan) * 1000;
    return Math.round(fps * 10) / 10; // Round to 1 decimal
  };
  
  /**
   * Calculate average latency from rolling window
   */
  const calculateAverageLatency = () => {
    const latencies = latencyWindowRef.current;
    if (latencies.length === 0) return 0;
    
    const sum = latencies.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / latencies.length);
  };
  
  /**
   * Initialize Web Audio API for audio playback
   */
  const initializeAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000 // Match device sample rate
      });
      
      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = audioVolume;
      gainNode.connect(ctx.destination);
      
      setAudioContext(ctx);
      gainNodeRef.current = gainNode;
      
      console.log('Audio context initialized with gain node');
    }
  };
  
  /**
   * Play audio data from base64 PCM
   */
  const playAudio = async (audioData) => {
    if (!audioContext || !audioData?.data || !audioEnabled) {
      console.log('Audio playback skipped:', { 
        hasContext: !!audioContext, 
        hasData: !!audioData?.data, 
        enabled: audioEnabled 
      });
      return;
    }
    
    try {
      console.log('Playing audio:', { 
        dataLength: audioData.data.length, 
        sampleRate: audioData.sample_rate 
      });
      
      // Decode base64 to binary
      const binaryString = atob(audioData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Decoded audio bytes:', bytes.length);
      
      // Convert to Float32Array (PCM data is typically int16)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      // Convert int16 to float32 (-1.0 to 1.0)
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      
      console.log('Audio samples:', float32Array.length);
      
      // Create audio buffer
      const sampleRate = audioData.sample_rate || 16000;
      const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);
      
      console.log('Audio buffer created, duration:', audioBuffer.duration, 'seconds');
      
      // Add to queue
      audioQueueRef.current.push(audioBuffer);
      
      // Start playback if not already playing
      if (!isPlayingAudioRef.current) {
        playNextAudioBuffer();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  /**
   * Play next audio buffer from queue
   */
  const playNextAudioBuffer = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      console.log('Audio queue empty, stopping playback');
      return;
    }
    
    isPlayingAudioRef.current = true;
    const buffer = audioQueueRef.current.shift();
    
    console.log('Playing audio buffer:', buffer.duration, 'seconds, volume:', audioVolume);
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Connect through gain node for volume control
    if (gainNodeRef.current) {
      source.connect(gainNodeRef.current);
    } else {
      source.connect(audioContext.destination);
    }
    
    // When this buffer finishes, play the next one
    source.onended = () => {
      console.log('Audio buffer finished');
      playNextAudioBuffer();
    };
    
    source.start(0);
    console.log('Audio buffer started');
  };
  
  /**
   * Toggle audio on/off
   */
  const toggleAudio = () => {
    if (!audioEnabled) {
      initializeAudio();
    }
    setAudioEnabled(!audioEnabled);
  };
  
  /**
   * Send metrics to server via WebSocket
   */
  const sendMetricsToServer = (metricsData) => {
    if (!sendMetrics || !isConnected) return;
    
    const now = Date.now();
    if (now - lastMetricsSentRef.current < METRICS_SEND_INTERVAL) return;
    
    const message = {
      action: 'stats',
      device_id: deviceId,
      metrics: {
        ...metricsData,
        timestamp: new Date().toISOString(),
        client_id: 'web_client' // Could be more specific
      }
    };
    
    sendMessage(message);
    lastMetricsSentRef.current = now;
    console.log('Sent metrics to server:', message);
  };
  
  // Subscribe/unsubscribe on mount/unmount
  useEffect(() => {
    if (autoSubscribe && deviceId) {
      subscribe(deviceId);
      
      return () => {
        unsubscribe(deviceId);
      };
    }
  }, [deviceId, autoSubscribe, subscribe, unsubscribe]);
  
  // Periodic metrics calculation and reporting
  useEffect(() => {
    if (!deviceId) return;
    
    metricsIntervalRef.current = setInterval(() => {
      const currentFps = calculateFPS();
      const averageLatency = calculateAverageLatency();
      const latencies = latencyWindowRef.current;
      
      const newMetrics = {
        currentFps,
        averageLatency,
        minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
        maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
        totalFrames: metrics.totalFrames,
        droppedFrames: metrics.droppedFrames
      };
      
      setMetrics(newMetrics);
      
      // Send metrics to server if enabled
      sendMetricsToServer(newMetrics);
    }, 1000); // Update every second
    
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [deviceId, metrics.totalFrames, metrics.droppedFrames, sendMetrics, isConnected]);
  
  // Frame rate limiting logic with performance tracking
  useEffect(() => {
    const latestFrame = latestFrames.get(deviceId);
    
    if (!latestFrame) return;
    
    const now = Date.now();
    const timeSinceLastFrame = now - lastFrameTimeRef.current;
    
    // Calculate latency (time between device capture and client receive)
    if (latestFrame.timestamp) {
      const deviceTime = new Date(latestFrame.timestamp).getTime();
      const latency = now - deviceTime;
      
      // Update latency window (keep last 10)
      latencyWindowRef.current.push(latency);
      if (latencyWindowRef.current.length > 10) {
        latencyWindowRef.current.shift();
      }
    }
    
    // Track total frames received
    setMetrics(prev => ({
      ...prev,
      totalFrames: prev.totalFrames + 1
    }));
    
    // Only update frame if enough time has passed (frame rate limiting)
    if (timeSinceLastFrame > MIN_FRAME_INTERVAL) {
      setDisplayedFrame(latestFrame);
      lastFrameTimeRef.current = now;
      
      // Play audio if available and enabled
      if (latestFrame.audio) {
        playAudio(latestFrame.audio);
      }
      
      // Update FPS tracking window (keep last 10 frames)
      frameTimestampsRef.current.push(now);
      if (frameTimestampsRef.current.length > 10) {
        frameTimestampsRef.current.shift();
      }
    } else {
      // Frame was dropped due to rate limiting
      setMetrics(prev => ({
        ...prev,
        droppedFrames: prev.droppedFrames + 1
      }));
    }
  }, [latestFrames, deviceId, MIN_FRAME_INTERVAL, audioEnabled]);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 1
    });
  };
  
  // Calculate frame age
  const getFrameAge = (timestamp) => {
    if (!timestamp) return null;
    const age = Date.now() - new Date(timestamp).getTime();
    return age < 1000 ? `${age}ms` : `${(age / 1000).toFixed(1)}s`;
  };
  
  if (!deviceId) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <Camera className="h-12 w-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400">No device ID provided</p>
      </div>
    );
  }
  
  if (!isConnected) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <Signal className="h-12 w-12 text-red-500 mx-auto mb-3 animate-pulse" />
        <p className="text-red-400 font-semibold">Not Connected</p>
        <p className="text-slate-400 text-sm mt-2">Waiting for WebSocket connection...</p>
      </div>
    );
  }
  
  if (!displayedFrame) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <Camera className="h-12 w-12 text-slate-500 mx-auto mb-3 animate-pulse" />
        <p className="text-slate-300 font-semibold">Waiting for frames...</p>
        <p className="text-slate-400 text-sm mt-2">Device ID: {deviceId}</p>
      </div>
    );
  }
  
  const frameAge = getFrameAge(displayedFrame.timestamp);
  const isFrameFresh = frameAge && parseInt(frameAge) < 2000; // Fresh if < 2 seconds
  
  // Performance warnings
  const showFpsWarning = metrics.currentFps > 0 && metrics.currentFps < FPS_WARNING_THRESHOLD;
  const showLatencyWarning = metrics.averageLatency > LATENCY_WARNING_THRESHOLD;
  const hasPerformanceIssue = showFpsWarning || showLatencyWarning;
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Frame Header */}
      <div className="bg-slate-900/80 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-400" />
            <span className="text-white font-semibold font-mono text-sm">{deviceId}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            {/* Audio Control Button */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
                audioEnabled 
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
              title={audioEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {audioEnabled ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
              <span className="font-semibold">{audioEnabled ? 'ON' : 'OFF'}</span>
            </button>
            
            {/* Volume Slider */}
            {audioEnabled && (
              <div className="flex items-center gap-2 bg-slate-700/50 px-2.5 py-1.5 rounded">
                <span className="text-slate-400 text-xs">Vol:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioVolume * 100}
                  onChange={(e) => {
                    const newVolume = e.target.value / 100;
                    setAudioVolume(newVolume);
                    if (gainNodeRef.current) {
                      gainNodeRef.current.gain.value = newVolume;
                    }
                    console.log('Volume changed to:', newVolume);
                  }}
                  className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#10b981'
                  }}
                />
                <span className="text-green-400 text-xs font-mono w-8">{Math.round(audioVolume * 100)}%</span>
              </div>
            )}
            
            {/* Frame Rate Indicator */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Signal className="h-3.5 w-3.5" />
              <span>{maxFps} FPS max</span>
            </div>
            
            {/* Frame Age Indicator */}
            <div className={`flex items-center gap-1.5 ${isFrameFresh ? 'text-green-400' : 'text-yellow-400'}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>{frameAge} ago</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Camera Feed */}
      <div className="relative bg-black aspect-video">
        {displayedFrame.image && (
          <img
            src={displayedFrame.image.startsWith('data:') 
              ? displayedFrame.image 
              : `data:image/jpeg;base64,${displayedFrame.image}`}
            alt={`Live feed from ${deviceId}`}
            className="w-full h-full object-contain"
          />
        )}
        
        {/* Live Indicator Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-white text-xs font-bold uppercase tracking-wide">Live</span>
          </div>
        </div>
        
        {/* Quality Badge */}
        {displayedFrame.metadata?.quality && (
          <div className="absolute top-3 right-3">
            <div className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-semibold text-slate-300">
              Q: {displayedFrame.metadata.quality}
            </div>
          </div>
        )}
        
        {/* Performance Metrics Overlay - Compact */}
        {showMetrics && metrics.totalFrames > 0 && (
          <div className="absolute bottom-2 right-2">
            {/* Compact Metrics Card */}
            <div className={`
              backdrop-blur-md rounded px-2 py-1 text-[10px] font-mono
              ${hasPerformanceIssue 
                ? 'bg-red-900/60 border border-red-500/50' 
                : 'bg-slate-900/70 border border-slate-700/50'
              }
            `}>
              {/* Single line metrics */}
              <div className="flex items-center gap-2 text-white">
                <span className={showFpsWarning ? 'text-red-400' : 'text-green-400'}>
                  {metrics.currentFps.toFixed(1)} FPS
                </span>
                <span className="text-slate-500">•</span>
                <span className={showLatencyWarning ? 'text-red-400' : 'text-blue-400'}>
                  {metrics.averageLatency}ms
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">
                  {metrics.totalFrames}f
                </span>
                {metrics.droppedFrames > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-yellow-400">
                      -{metrics.droppedFrames}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Warning tooltip - only show when hovering */}
            {hasPerformanceIssue && (
              <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block">
                <div className="bg-yellow-900/90 backdrop-blur-md border border-yellow-500/50 rounded px-2 py-1 text-[9px] text-yellow-200 whitespace-nowrap">
                  {showFpsWarning && <div>• Low FPS: Check network connection</div>}
                  {showLatencyWarning && <div>• High latency: {metrics.averageLatency}ms</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Frame Metadata */}
      <div className="bg-slate-900/50 border-t border-slate-700 px-4 py-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-xs">{formatTimestamp(displayedFrame.timestamp)}</span>
          </div>
          
          {/* Location */}
          {displayedFrame.metadata?.location && (
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4" />
              <span className="text-xs capitalize">{displayedFrame.metadata.location}</span>
            </div>
          )}
          
          {/* Resolution */}
          {displayedFrame.metadata?.resolution && (
            <div className="text-slate-400 text-xs">
              <span className="font-semibold">Resolution:</span>{' '}
              {displayedFrame.metadata.resolution}
            </div>
          )}
          
          {/* Device Type */}
          {displayedFrame.metadata?.device_type && (
            <div className="text-slate-400 text-xs">
              <span className="font-semibold">Type:</span>{' '}
              {displayedFrame.metadata.device_type}
            </div>
          )}
        </div>
        
        {/* Alert Display */}
        {displayedFrame.alert && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-500 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1.5 animate-pulse"></div>
              <div>
                <p className="text-red-300 font-semibold text-sm">Alert</p>
                <p className="text-red-200 text-sm mt-1">{displayedFrame.alert}</p>
                {displayedFrame.alertTimestamp && (
                  <p className="text-red-400 text-xs mt-1">
                    {formatTimestamp(displayedFrame.alertTimestamp)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Status Display */}
        {displayedFrame.status && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${
              displayedFrame.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-slate-400">
              Device {displayedFrame.status}
              {displayedFrame.last_seen && ` - Last seen: ${formatTimestamp(displayedFrame.last_seen)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
