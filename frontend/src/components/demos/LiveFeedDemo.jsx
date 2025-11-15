import React, { useState } from 'react';
import { WebSocketProvider } from '../context/WebSocketContext';
import LiveFeed from './LiveFeed';
import { Plus, X } from 'lucide-react';

/**
 * LiveFeed Grid Demo
 * 
 * Demonstrates multiple LiveFeed components displaying
 * different camera feeds with frame rate limiting.
 */
const LiveFeedDemo = () => {
  const [feeds, setFeeds] = useState([
    { id: 1, deviceId: 'camera-001' },
  ]);
  const [newDeviceId, setNewDeviceId] = useState('');

  const addFeed = () => {
    if (newDeviceId.trim()) {
      setFeeds([
        ...feeds,
        { id: Date.now(), deviceId: newDeviceId.trim() }
      ]);
      setNewDeviceId('');
    }
  };

  const removeFeed = (id) => {
    setFeeds(feeds.filter(feed => feed.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Live Camera Feeds
          </h1>
          <p className="text-slate-400">
            Real-time camera monitoring with intelligent frame rate limiting (5 fps max)
          </p>
        </div>

        {/* Add New Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newDeviceId}
              onChange={(e) => setNewDeviceId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFeed()}
              placeholder="Enter device ID (e.g., camera-002)"
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addFeed}
              disabled={!newDeviceId.trim()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                newDeviceId.trim()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="h-5 w-5" />
              Add Feed
            </button>
          </div>
        </div>

        {/* Feed Grid */}
        {feeds.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No camera feeds added</p>
            <p className="text-slate-500 text-sm mt-2">Add a device ID above to start monitoring</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {feeds.map((feed) => (
              <div key={feed.id} className="relative">
                {/* Remove button */}
                {feeds.length > 1 && (
                  <button
                    onClick={() => removeFeed(feed.id)}
                    className="absolute -top-2 -right-2 z-10 bg-red-600 hover:bg-red-500 text-white rounded-full p-1.5 shadow-lg transition-all"
                    aria-label="Remove feed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                {/* LiveFeed component with frame rate limiting */}
                <LiveFeed 
                  deviceId={feed.deviceId}
                  autoSubscribe={true}
                  maxFps={5}
                />
              </div>
            ))}
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Frame Rate Limiting</h2>
          <div className="space-y-3 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              <div>
                <p className="font-semibold text-white">Maximum 5 FPS</p>
                <p className="text-sm text-slate-400">Frames are throttled to update at most every 200ms</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
              <div>
                <p className="font-semibold text-white">CPU Efficiency</p>
                <p className="text-sm text-slate-400">Prevents excessive UI updates and reduces client-side processing</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
              <div>
                <p className="font-semibold text-white">Smart Throttling</p>
                <p className="text-sm text-slate-400">Uses timestamps to skip intermediate frames while maintaining smooth updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Active Feeds</div>
            <div className="text-white text-3xl font-bold">{feeds.length}</div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Max Frame Rate</div>
            <div className="text-white text-3xl font-bold">5 FPS</div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Frame Interval</div>
            <div className="text-white text-3xl font-bold">200ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component with WebSocket provider
const LiveFeedDemoWithProvider = () => {
  return (
    <WebSocketProvider url="ws://localhost:8000/ws">
      <LiveFeedDemo />
    </WebSocketProvider>
  );
};

export default LiveFeedDemoWithProvider;
