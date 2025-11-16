import React from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { WebSocketProvider } from './context/WebSocketContext';

/**
 * Root App Provider
 * Wraps the application with all necessary context providers
 * 
 * Order matters: NotificationProvider must wrap WebSocketProvider
 * so WebSocketContext can use notification hooks
 */
const AppProviders = ({ children }) => {
  return (
    <NotificationProvider maxVisible={3} defaultDuration={4000}>
      <WebSocketProvider url={import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'}>
        {children}
      </WebSocketProvider>
    </NotificationProvider>
  );
};

export default AppProviders;
