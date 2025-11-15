import React, { useState, useEffect, useRef } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';

// Frame rate limiting configuration
const MIN_FRAME_INTERVAL = 200; // 200ms = 5 fps max

/**
 * Example component demonstrating WebSocketContext usage with frame rate limiting
 */
export const DeviceMonitor = () => {
  const { isConnected, subscribe, unsubscribe, latestFrames, error, subscribedDevices } = useWebSocketContext();
  const [deviceId, setDeviceId] = useState('');
  
  // State for rate-limited frames
  const [displayedFrames, setDisplayedFrames] = useState(new Map());
  
  // Ref to track last frame update time per device
  const lastFrameTimesRef = useRef(new Map());
  
  const handleSubscribe = () => {
    if (deviceId.trim()) {
      subscribe(deviceId.trim());
      setDeviceId('');
    }
  };
  
  const handleUnsubscribe = (id) => {
    unsubscribe(id);
  };
  
  // Frame rate limiting effect
  useEffect(() => {
    const now = Date.now();
    const newDisplayedFrames = new Map(displayedFrames);
    let updated = false;
    
    // Check each device's latest frame
    latestFrames.forEach((frame, deviceId) => {
      const lastFrameTime = lastFrameTimesRef.current.get(deviceId) || 0;
      const timeSinceLastFrame = now - lastFrameTime;
      
      // Only update if enough time has passed
      if (timeSinceLastFrame > MIN_FRAME_INTERVAL) {
        newDisplayedFrames.set(deviceId, frame);
        lastFrameTimesRef.current.set(deviceId, now);
        updated = true;
      }
    });
    
    // Remove frames for unsubscribed devices
    displayedFrames.forEach((_, deviceId) => {
      if (!latestFrames.has(deviceId)) {
        newDisplayedFrames.delete(deviceId);
        lastFrameTimesRef.current.delete(deviceId);
        updated = true;
      }
    });
    
    if (updated) {
      setDisplayedFrames(newDisplayedFrames);
    }
  }, [latestFrames, displayedFrames]);
  
  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Device Monitor</h2>
      
      {/* Connection Status */}
      <div className="mb-4 flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-gray-300 font-semibold">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-300">
          {error}
        </div>
      )}
      
      {/* Subscribe to Device */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Subscribe to Device</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
            placeholder="Enter device ID"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSubscribe}
            disabled={!isConnected || !deviceId.trim()}
            className={`px-4 py-2 rounded font-semibold transition-all ${
              isConnected && deviceId.trim()
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Subscribe
          </button>
        </div>
      </div>
      
      {/* Subscribed Devices */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Subscribed Devices ({subscribedDevices.length})
        </h3>
        {subscribedDevices.length === 0 ? (
          <p className="text-gray-400 italic">No devices subscribed</p>
        ) : (
          <div className="space-y-2">
            {subscribedDevices.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between p-3 bg-slate-700 rounded"
              >
                <span className="text-white font-mono">{id}</span>
                <button
                  onClick={() => handleUnsubscribe(id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-semibold transition-all"
                >
                  Unsubscribe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Latest Frames (Rate-Limited) */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Latest Frames ({displayedFrames.size})
          <span className="text-sm text-slate-400 font-normal ml-2">
            (Rate-limited: 5 fps max)
          </span>
        </h3>
        {displayedFrames.size === 0 ? (
          <p className="text-gray-400 italic">No frames received yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(displayedFrames.entries()).map(([deviceId, frame]) => (
              <div key={deviceId} className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 font-mono">{deviceId}</h4>
                
                {frame.image && (
                  <div className="mb-2">
                    <img
                      src={frame.image.startsWith('data:') ? frame.image : `data:image/jpeg;base64,${frame.image}`}
                      alt={`Frame from ${deviceId}`}
                      className="w-full rounded"
                    />
                  </div>
                )}
                
                <div className="text-sm text-gray-400 space-y-1">
                  <p>
                    <span className="font-semibold">Timestamp:</span>{' '}
                    {new Date(frame.timestamp).toLocaleTimeString()}
                  </p>
                  {frame.metadata && (
                    <>
                      {frame.metadata.device_type && (
                        <p>
                          <span className="font-semibold">Type:</span> {frame.metadata.device_type}
                        </p>
                      )}
                      {frame.metadata.location && (
                        <p>
                          <span className="font-semibold">Location:</span> {frame.metadata.location}
                        </p>
                      )}
                    </>
                  )}
                  {frame.alert && (
                    <div className="mt-2 p-2 bg-red-900/30 border border-red-500 rounded text-red-300">
                      <p className="font-semibold">Alert:</p>
                      <p>{frame.alert}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceMonitor;
