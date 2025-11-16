import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * Example component demonstrating useWebSocket hook usage
 */
export const WebSocketExample = () => {
  const { isConnected, lastMessage, sendMessage, error } = useWebSocket('ws://localhost:8000/ws');
  
  const handleSendMessage = () => {
    const message = {
      type: 'ping',
      timestamp: new Date().toISOString()
    };
    sendMessage(message);
  };
  
  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">WebSocket Connection</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-300">
          {error}
        </div>
      )}
      
      {/* Last Message */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Last Message:</h3>
        <pre className="p-3 bg-slate-900 rounded text-gray-300 text-sm overflow-auto">
          {lastMessage ? JSON.stringify(lastMessage, null, 2) : 'No messages yet'}
        </pre>
      </div>
      
      {/* Send Message Button */}
      <button
        onClick={handleSendMessage}
        disabled={!isConnected}
        className={`px-4 py-2 rounded font-semibold transition-all ${
          isConnected
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        Send Test Message
      </button>
    </div>
  );
};

export default WebSocketExample;
