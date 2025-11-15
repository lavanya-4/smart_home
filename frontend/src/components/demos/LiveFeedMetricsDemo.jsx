import React, { useState, useEffect } from 'react';
import { WebSocketProvider, useWebSocketContext } from '../context/WebSocketContext';
import LiveFeed from './LiveFeed';
import { Activity, Clock, TrendingUp, Signal, AlertTriangle, Info, Play, Pause } from 'lucide-react';

/**
 * Demo component showcasing LiveFeed with performance metrics
 */
const LiveFeedMetricsDemoInner = () => {
  const { isConnected, subscribe } = useWebSocketContext();
  const [selectedDevice, setSelectedDevice] = useState('camera-001');
  const [showMetrics, setShowMetrics] = useState(true);
  const [sendMetrics, setSendMetrics] = useState(false);
  const [maxFps, setMaxFps] = useState(5);
  
  // Sample devices for demo
  const devices = [
    { id: 'camera-001', name: 'Living Room', location: 'Main Floor' },
    { id: 'camera-002', name: 'Front Door', location: 'Entrance' },
    { id: 'camera-003', name: 'Backyard', location: 'Outdoor' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            LiveFeed Performance Metrics Demo
          </h1>
          <p className="text-slate-600">
            Real-time FPS tracking, latency measurement, and performance warnings
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Device Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Device
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.id})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Max FPS */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Max FPS: {maxFps}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={maxFps}
                onChange={(e) => setMaxFps(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Show Metrics Toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Metrics Overlay
              </label>
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                  showMetrics
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {showMetrics ? (
                  <span className="flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" /> Enabled
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Pause className="h-4 w-4" /> Disabled
                  </span>
                )}
              </button>
            </div>
            
            {/* Send Metrics Toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Send to Server
              </label>
              <button
                onClick={() => setSendMetrics(!sendMetrics)}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                  sendMetrics
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {sendMetrics ? (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Enabled
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Signal className="h-4 w-4" /> Disabled
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Feed with Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Live Feed</h2>
          
          <LiveFeed
            deviceId={selectedDevice}
            autoSubscribe={true}
            maxFps={maxFps}
            showMetrics={showMetrics}
            sendMetrics={sendMetrics}
          />
        </div>

        {/* Features Documentation */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Performance Metrics Features</h2>
          
          <div className="space-y-6">
            {/* FPS Tracking */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Frames Per Second (FPS)</h3>
                <p className="text-slate-600 text-sm">
                  Calculates actual FPS from rolling window of last 10 frames.
                  Shows warning (red) if FPS drops below 3 fps.
                  Formula: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">(frames - 1) / timeSpan * 1000</code>
                </p>
              </div>
            </div>

            {/* Latency Tracking */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Average Latency</h3>
                <p className="text-slate-600 text-sm">
                  Measures time between device capture timestamp and client receive time.
                  Calculates rolling average over last 10 frames.
                  Shows warning (red) if latency exceeds 2000ms (2 seconds).
                  Displays min/max latency range.
                </p>
              </div>
            </div>

            {/* Frame Counting */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Total Frames</h3>
                <p className="text-slate-600 text-sm">
                  Tracks total number of frames received from the device.
                  Counts every frame regardless of display rate limiting.
                  Useful for understanding actual data throughput.
                </p>
              </div>
            </div>

            {/* Dropped Frames */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Signal className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Dropped Frames</h3>
                <p className="text-slate-600 text-sm">
                  Counts frames skipped due to frame rate limiting.
                  Shows percentage of dropped vs. total frames.
                  Example: If maxFps=5 but device sends 20fps, ~75% will be dropped.
                  This is intentional to prevent UI overload.
                </p>
              </div>
            </div>

            {/* Performance Warnings */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Performance Warnings</h3>
                <p className="text-slate-600 text-sm">
                  Automatic warnings appear when performance issues detected:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 ml-4">
                  <li>• <strong>Low FPS Warning:</strong> Triggered when FPS {"<"} 3</li>
                  <li>• <strong>High Latency Warning:</strong> Triggered when latency {">"} 2000ms</li>
                  <li>• <strong>Visual Indicators:</strong> Red overlay border, pulsing alert icon</li>
                  <li>• <strong>Performance Tips:</strong> Shows suggestions to improve performance</li>
                </ul>
              </div>
            </div>

            {/* Server Metrics */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Send Metrics to Server</h3>
                <p className="text-slate-600 text-sm">
                  Optional: Send performance metrics back to server every 5 seconds.
                  Payload includes: FPS, latency (avg/min/max), total frames, dropped frames.
                  Server can use this for monitoring, analytics, or adaptive quality adjustment.
                  Message format: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{'{ action: "stats", device_id, metrics: {...} }'}</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Calculation Details */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Metrics Calculation</h2>
          
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Rolling Window Approach</h3>
              <p className="text-sm text-slate-700 mb-3">
                All metrics use a rolling window of the last 10 frames for accurate real-time calculations:
              </p>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="font-mono bg-slate-200 px-2 py-1 rounded text-xs">frameTimestampsRef</span>
                  <span>- Stores timestamps of last 10 displayed frames</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono bg-slate-200 px-2 py-1 rounded text-xs">latencyWindowRef</span>
                  <span>- Stores latency values of last 10 frames</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">FPS Calculation</h3>
              <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const calculateFPS = () => {
  const timestamps = frameTimestampsRef.current;
  if (timestamps.length < 2) return 0;
  
  const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
  const fps = ((timestamps.length - 1) / timeSpan) * 1000;
  return Math.round(fps * 10) / 10; // Round to 1 decimal
};`}
              </pre>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Latency Calculation</h3>
              <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`// On frame receive:
const deviceTime = new Date(frame.timestamp).getTime();
const receiveTime = Date.now();
const latency = receiveTime - deviceTime;

// Average calculation:
const calculateAverageLatency = () => {
  const latencies = latencyWindowRef.current;
  const sum = latencies.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / latencies.length);
};`}
              </pre>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Usage Examples</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <strong>Basic usage with metrics:</strong>
                  <pre className="mt-1 bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`<LiveFeed 
  deviceId="camera-001" 
  maxFps={5}
  showMetrics={true}
/>`}
                  </pre>
                </div>
                
                <div>
                  <strong>High performance mode with server reporting:</strong>
                  <pre className="mt-1 bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`<LiveFeed 
  deviceId="camera-002" 
  maxFps={15}
  showMetrics={true}
  sendMetrics={true}
/>`}
                  </pre>
                </div>
                
                <div>
                  <strong>Minimal mode (no metrics overlay):</strong>
                  <pre className="mt-1 bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`<LiveFeed 
  deviceId="camera-003" 
  maxFps={10}
  showMetrics={false}
/>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Demo wrapper with WebSocketProvider
 */
const LiveFeedMetricsDemo = () => {
  return (
    <WebSocketProvider url="ws://localhost:8000/ws">
      <LiveFeedMetricsDemoInner />
    </WebSocketProvider>
  );
};

export default LiveFeedMetricsDemo;
