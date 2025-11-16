import React from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import ConnectionStatus from './ConnectionStatus';

/**
 * Example: ConnectionStatus in App Header
 * 
 * This demonstrates how to integrate the ConnectionStatus component
 * into your application header/navbar to show WebSocket connection status.
 */
const ConnectionStatusExample = () => {
  const { isConnected } = useWebSocketContext();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* App Header with ConnectionStatus */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-xl font-bold text-white">Smart Home</h1>
          </div>

          {/* Right: Connection Status */}
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            WebSocket Connection Status Demo
          </h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Connection Status:</span>
              <span className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-sm text-slate-400">
              The connection status indicator in the top-right corner shows real-time WebSocket connection state:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Green dot with "Connected" when connection is active</li>
                <li>Red dot with "Reconnecting..." when connection is lost</li>
                <li>Animated pulse effect for visual feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConnectionStatusExample;
