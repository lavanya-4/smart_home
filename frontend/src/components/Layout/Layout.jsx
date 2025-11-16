import React from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import ConnectionStatus from '../UI/ConnectionStatus';
import Sidebar from './Sidebar';

export default function Layout({ children, currentPage, user, onLogout }) {
  const { isConnected, connectionAttempts, isUnstable, error } = useWebSocketContext();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex w-full">
      <Sidebar currentPage={currentPage} user={user} onLogout={onLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-900/70 border-b border-slate-800 px-6 py-4 flex items-center justify-end">
          <ConnectionStatus
            isConnected={isConnected}
            connectionAttempts={connectionAttempts}
            isUnstable={isUnstable}
            error={error}
          />
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
