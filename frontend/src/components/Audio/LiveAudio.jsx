import React, { useState, useEffect, useRef } from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import { Mic, Clock, MapPin, Signal, Activity, Volume2, VolumeX, Play, Pause, TrendingUp } from 'lucide-react';

/**
 * LiveAudio Component for Microphone Devices
 * 
 * Displays live audio feed from IoT microphone devices with real-time visualization,
 * audio level monitoring, and playback controls.
 * 
 * @param {Object} props
 * @param {string} props.deviceId - Device ID to receive audio from
 * @param {boolean} props.autoSubscribe - Auto-subscribe on mount (default: true)
 * @param {boolean} props.autoPlay - Auto-play audio on receive (default: true)
 * @param {boolean} props.showMetrics - Show performance metrics overlay (default: true)
 */
const LiveAudio = ({ 
  deviceId, 
  autoSubscribe = true,
  autoPlay = true,
  showMetrics = true
}) => {
  const { isConnected, subscribe, unsubscribe, latestFrames } = useWebSocketContext();
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(autoPlay);
  const [audioContext, setAudioContext] = useState(null);
  const [audioVolume, setAudioVolume] = useState(0.8); // 0.0 to 1.0
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0-100
  
  // Performance metrics
  const [metrics, setMetrics] = useState({
    totalChunks: 0,
    avgSampleRate: 0,
    totalDuration: 0,
    queueLength: 0
  });
  
  // Refs
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastAudioTimeRef = useRef(Date.now());
  const lastProcessedTimestampRef = useRef(null); // Track last processed frame
  
  /**
   * Initialize Web Audio API for audio playback and visualization
   */
  const initializeAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000 // Match device sample rate
      });
      
      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = audioVolume;
      
      // Create analyser for visualization
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      // Connect: gain -> analyser -> destination
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);
      
      setAudioContext(ctx);
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      startAudioLevelMonitoring();
      
      console.log('Audio context initialized with analyser');
    }
  };
  
  /**
   * Monitor audio levels for visualization
   */
  const startAudioLevelMonitoring = () => {
    const updateLevel = () => {
      if (analyserRef.current && isPlayingAudioRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        // Use time domain data for waveform amplitude
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for better level detection
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(100, rms * 300); // Amplify for visibility
        
        setAudioLevel(level);
      } else {
        setAudioLevel(0);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };
  
  /**
   * Play audio data from base64 PCM
   */
  const playAudio = async (audioData) => {
    console.log('LiveAudio: playAudio called', {
      hasContext: !!audioContext,
      hasData: !!audioData?.data,
      enabled: audioEnabled,
      dataLength: audioData?.data?.length
    });
    
    if (!audioContext || !audioData?.data || !audioEnabled) {
      console.log('LiveAudio: Skipping audio playback - missing requirements');
      return;
    }
    
    try {
      console.log('LiveAudio: Decoding audio data...');
      // Decode base64 to binary
      const binaryString = atob(audioData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('LiveAudio: Decoded bytes:', bytes.length);
      
      // Convert to Float32Array (PCM data is int16)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      // Convert int16 to float32 (-1.0 to 1.0)
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      
      console.log('LiveAudio: Created float32 array:', float32Array.length);
      
      // Create audio buffer
      const sampleRate = audioData.sample_rate || 16000;
      const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);
      
      console.log('LiveAudio: Created audio buffer, duration:', audioBuffer.duration, 'seconds');
      
      // No queue limit - play full 3-second audio chunks
      
      // Add to queue
      audioQueueRef.current.push(audioBuffer);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalChunks: prev.totalChunks + 1,
        avgSampleRate: sampleRate,
        totalDuration: prev.totalDuration + audioBuffer.duration,
        queueLength: audioQueueRef.current.length
      }));
      
      // Start playback immediately if not already playing
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
      setIsPlaying(false);
      setMetrics(prev => ({ ...prev, queueLength: 0 }));
      return;
    }
    
    isPlayingAudioRef.current = true;
    setIsPlaying(true);
    const buffer = audioQueueRef.current.shift();
    
    setMetrics(prev => ({ ...prev, queueLength: audioQueueRef.current.length }));
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Connect through gain node
    if (gainNodeRef.current) {
      source.connect(gainNodeRef.current);
    } else {
      source.connect(audioContext.destination);
    }
    
    // When this buffer finishes, play the next one
    source.onended = () => {
      playNextAudioBuffer();
    };
    
    source.start(0);
    lastAudioTimeRef.current = Date.now();
  };
  
  /**
   * Toggle audio playback
   */
  const toggleAudio = () => {
    const newState = !audioEnabled;
    console.log('LiveAudio: Toggling audio', { from: audioEnabled, to: newState });
    
    if (newState && !audioContext) {
      console.log('LiveAudio: Initializing audio context');
      initializeAudio();
    }
    setAudioEnabled(newState);
  };
  
  /**
   * Clear audio queue
   */
  const clearQueue = () => {
    audioQueueRef.current = [];
    setMetrics(prev => ({ ...prev, queueLength: 0 }));
  };
  
  // Subscribe/unsubscribe on mount/unmount
  useEffect(() => {
    if (autoSubscribe && deviceId) {
      subscribe(deviceId);
      console.log('LiveAudio: Subscribed to device', deviceId);
      
      return () => {
        unsubscribe(deviceId);
        console.log('LiveAudio: Unsubscribed from device', deviceId);
      };
    }
  }, [deviceId, autoSubscribe, subscribe, unsubscribe]);
  
  // Initialize audio on mount if autoPlay is enabled
  useEffect(() => {
    if (autoPlay && !audioContext) {
      console.log('LiveAudio: Auto-initializing audio context');
      initializeAudio();
    }
  }, [autoPlay]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);
  
  // Process incoming audio frames
  useEffect(() => {
    const latestFrame = latestFrames.get(deviceId);
    
    console.log('LiveAudio: Frame check', { 
      deviceId, 
      hasFrame: !!latestFrame, 
      hasAudio: !!latestFrame?.audio,
      audioEnabled,
      timestamp: latestFrame?.timestamp 
    });
    
    if (!latestFrame?.audio) return;
    
    // Check if this is a new frame by comparing timestamps
    const frameTimestamp = latestFrame.timestamp;
    if (frameTimestamp === lastProcessedTimestampRef.current) {
      // Already processed this frame, skip it
      console.log('LiveAudio: Skipping duplicate frame');
      return;
    }
    
    // Update last processed timestamp
    lastProcessedTimestampRef.current = frameTimestamp;
    
    console.log('LiveAudio: Processing new audio frame', frameTimestamp);
    
    // Play audio if enabled
    if (audioEnabled) {
      playAudio(latestFrame.audio);
    }
  }, [latestFrames, deviceId, audioEnabled]);
  
  // Format timestamp
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
  
  // Get latest frame
  const latestFrame = latestFrames.get(deviceId);
  const timeSinceLastAudio = Date.now() - lastAudioTimeRef.current;
  const isReceivingAudio = timeSinceLastAudio < 2000;
  
  if (!deviceId) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <Mic className="h-12 w-12 text-slate-500 mx-auto mb-3" />
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
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Compact Audio Header */}
      <div className="bg-slate-900/80 border-b border-slate-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-purple-400" />
            <span className="text-white font-semibold text-xs">{deviceId.slice(0, 20)}...</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Compact Status */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
              isReceivingAudio 
                ? 'bg-green-600/20 text-green-400' 
                : 'bg-slate-700/50 text-slate-400'
            }`}>
              <Signal className="h-3 w-3" />
              <span className="font-semibold">{isReceivingAudio ? 'RX' : 'WAIT'}</span>
            </div>
            
            {isPlaying && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-600/20 text-blue-400">
                <Activity className="h-3 w-3 animate-pulse" />
                <span className="font-semibold">PLAY</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Compact Audio Visualization & Controls */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-3">
        {/* Compact Audio Level Visualizer */}
        <div className="mb-3">
          <div className="flex items-center justify-center mb-2">
            <Mic className={`h-8 w-8 ${audioEnabled ? 'text-purple-400' : 'text-slate-600'} transition-colors`} />
          </div>
          
          {/* Compact Audio Level Bar */}
          <div className="relative h-10 bg-slate-700/50 rounded overflow-hidden border border-slate-600">
            {/* Level Fill */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
              style={{ 
                width: `${audioLevel}%`,
                opacity: audioEnabled ? 0.6 : 0.2
              }}
            />
            
            {/* Level Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg font-mono drop-shadow-lg">
                {audioEnabled ? Math.round(audioLevel) : 0}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Compact Audio Controls */}
        <div className="space-y-2">
          {/* Compact Play/Pause Button */}
          <button
            onClick={toggleAudio}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-all ${
              audioEnabled
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Audio ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Enable Audio</span>
              </>
            )}
          </button>
          
          {/* Compact Volume Slider */}
          {audioEnabled && (
            <div className="bg-slate-700/50 rounded p-2 border border-slate-600">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                  <Volume2 className="h-3 w-3 text-purple-400" />
                  Vol
                </label>
                <span className="text-sm font-bold text-purple-400 font-mono">
                  {Math.round(audioVolume * 100)}%
                </span>
              </div>
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
                }}
                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${audioVolume * 100}%, #475569 ${audioVolume * 100}%, #475569 100%)`
                }}
              />
            </div>
          )}
          
          {/* Clear Queue Button */}
          {metrics.queueLength > 0 && (
            <button
              onClick={clearQueue}
              className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-colors text-sm border border-red-600/50"
            >
              Clear Queue ({metrics.queueLength} chunks)
            </button>
          )}
        </div>
        
        {/* Compact Live Indicator */}
        {audioEnabled && isReceivingAudio && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1.5 bg-purple-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              <span className="text-white text-[10px] font-bold uppercase tracking-wide">LIVE</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Compact Metrics Section */}
      {showMetrics && metrics.totalChunks > 0 && (
        <div className="bg-slate-900/50 border-t border-slate-700 px-3 py-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Chunks: <span className="text-white font-bold">{metrics.totalChunks}</span></span>
            <span>Rate: <span className="text-white font-bold">{metrics.avgSampleRate}Hz</span></span>
            <span>Queue: <span className="text-white font-bold">{metrics.queueLength}</span></span>
          </div>
        </div>
      )}
      
      {/* Frame Metadata */}
      {latestFrame && (
        <div className="bg-slate-900/50 border-t border-slate-700 px-4 py-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {/* Timestamp */}
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-xs">{formatTimestamp(latestFrame.timestamp)}</span>
            </div>
            
            {/* Location */}
            {latestFrame.metadata?.location && (
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs capitalize">{latestFrame.metadata.location}</span>
              </div>
            )}
            
            {/* Audio Format */}
            {latestFrame.audio && (
              <div className="text-slate-400 text-xs">
                <span className="font-semibold">Format:</span>{' '}
                {latestFrame.audio.format || 'PCM16'}
              </div>
            )}
            
            {/* Channels */}
            {latestFrame.audio && (
              <div className="text-slate-400 text-xs">
                <span className="font-semibold">Channels:</span>{' '}
                {latestFrame.audio.channels === 1 ? 'Mono' : 'Stereo'}
              </div>
            )}
          </div>
          
          {/* Status Display */}
          {latestFrame.status && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${
                latestFrame.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-slate-400">
                Device {latestFrame.status}
                {latestFrame.last_seen && ` - Last seen: ${formatTimestamp(latestFrame.last_seen)}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveAudio;
