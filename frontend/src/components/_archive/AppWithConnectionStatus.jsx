import React, { useState } from 'react';
import { WebSocketProvider, useWebSocketContext } from '../context/WebSocketContext';
import AppShellWithStatus from './AppShellWithStatus';
import HomeDashboard from './HomeDashboard';

/**
 * App Integration Example with ConnectionStatus
 * 
 * This shows how to integrate the ConnectionStatus component
 * into your main app with WebSocket context.
 */

// Inner component that has access to WebSocket context
function AppContent() {
  const [currentPage, setCurrentPage] = useState('/');
  const { isConnected } = useWebSocketContext();

  const navigate = (path) => {
    setCurrentPage(path);
  };

  return (
    <AppShellWithStatus 
      currentPage={currentPage} 
      navigate={navigate}
      isConnected={isConnected}
    >
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Dashboard
          </h2>
          <p className="text-slate-300">
            The connection status is displayed in the top-right corner of the header.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Status Indicator</h3>
            <p className="text-sm text-slate-400">
              ✅ Green = Connected<br/>
              🔴 Red = Reconnecting
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Features</h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Animated pulse effect</li>
              <li>• WiFi icon indicator</li>
              <li>• Small and unobtrusive</li>
              <li>• Real-time updates</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShellWithStatus>
  );
}

// Main app component with WebSocket provider
function AppWithConnectionStatus() {
  return (
    <WebSocketProvider url="ws://localhost:8000/ws">
      <AppContent />
    </WebSocketProvider>
  );
}

export default AppWithConnectionStatus;
