import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  createSubscribeMessage, 
  createUnsubscribeMessage,
  isFrameMessage,
  isAlertMessage,
  isStatusMessage,
  isErrorMessage
} from '../types/websocket-types';
import { useDeviceNotifications } from './NotificationContext';

/**
 * WebSocket Context for global connection sharing
 * @type {React.Context<import('../types/websocket-types').WebSocketContextValue | null>}
 */
const WebSocketContext = createContext(null);

/**
 * WebSocket Provider Component
 * Manages a single WebSocket connection and device subscriptions
 */
export const WebSocketProvider = ({ children, url = 'ws://localhost:8000/ws' }) => {
  const { 
    isConnected, 
    lastMessage, 
    sendMessage, 
    error, 
    connectionAttempts, 
    isUnstable 
  } = useWebSocket(url);
  
  // Get device notification functions
  const deviceNotifications = useDeviceNotifications ? useDeviceNotifications() : null;
  // Set of subscribed device IDs
  const [subscribedDevices, setSubscribedDevices] = useState(new Set());
  
  // Map of device_id -> { image, timestamp }
  const [latestFrames, setLatestFrames] = useState(new Map());
  
  /**
   * Subscribe to updates from a specific device
   * @param {string} deviceId - Device ID to subscribe to
   */
  const subscribe = useCallback((deviceId) => {
    if (!deviceId) {
      console.warn('Device ID is required for subscription');
      return;
    }
    
    setSubscribedDevices((prev) => {
      const newSet = new Set(prev);
      newSet.add(deviceId);
      console.log(`Subscribed to device: ${deviceId}`);
      return newSet;
    });
    
    // Send subscription message to server
    if (isConnected) {
      const message = createSubscribeMessage(deviceId);
      sendMessage(message);
    }
  }, [isConnected, sendMessage]);
  
  /**
   * Unsubscribe from a specific device
   * @param {string} deviceId - Device ID to unsubscribe from
   */
  const unsubscribe = useCallback((deviceId) => {
    if (!deviceId) {
      console.warn('Device ID is required for unsubscription');
      return;
    }
    
    setSubscribedDevices((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deviceId);
      console.log(`Unsubscribed from device: ${deviceId}`);
      return newSet;
    });
    
    // Remove from latest frames
    setLatestFrames((prev) => {
      const newMap = new Map(prev);
      newMap.delete(deviceId);
      return newMap;
    });
    
    // Send unsubscribe message to server
    if (isConnected) {
      const message = createUnsubscribeMessage(deviceId);
      sendMessage(message);
    }
  }, [isConnected, sendMessage]);
  
  /**
   * Process incoming WebSocket messages
   * Filter by subscribed devices and update latest frames
   */
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      // Handle different message types
      /** @type {import('../types/websocket-types').ServerMessage} */
      const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
      
      // Handle system messages (error, connection)
      if (isErrorMessage(message)) {
        console.error('WebSocket error:', message.message);
        return;
      }
      
      // Check if message contains device_id
      const deviceId = message.device_id || message.deviceId;
      
      if (!deviceId) {
        // Message doesn't have device_id, might be a system message
        console.log('Received system message:', message);
        return;
      }
      
      // Only process if we're subscribed to this device
      if (!subscribedDevices.has(deviceId)) {
        console.debug(`Ignoring message from non-subscribed device: ${deviceId}`);
        return;
      }
      
      // Handle frame messages
      if (isFrameMessage(message)) {
        setLatestFrames((prev) => {
          const newMap = new Map(prev);
          newMap.set(deviceId, {
            image: message.image,
            audio: message.audio, // Include audio data
            timestamp: message.timestamp,
            metadata: message.metadata || {}
          });
          return newMap;
        });
        
        console.log(`Updated frame for device: ${deviceId}`, { 
          hasImage: !!message.image, 
          hasAudio: !!message.audio 
        });
      } 
      // Handle alert messages
      else if (isAlertMessage(message)) {
        console.warn(`Alert from device ${deviceId}:`, message.alert);
        
        setLatestFrames((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(deviceId) || {};
          newMap.set(deviceId, {
            ...existing,
            alert: message.alert,
            alertTimestamp: message.timestamp
          });
          return newMap;
        });
      }
      // Handle status messages
      else if (isStatusMessage(message)) {
        const previousStatus = latestFrames.get(deviceId)?.status;
        const newStatus = message.status;
        
        console.log(`Device ${deviceId} status: ${newStatus}`);
        
        // Show notification for status changes
        if (deviceNotifications && previousStatus && previousStatus !== newStatus) {
          if (newStatus === 'online') {
            deviceNotifications.notifyDeviceConnected(deviceId, message.device_name);
          } else if (newStatus === 'offline') {
            deviceNotifications.notifyDeviceDisconnected(deviceId, message.device_name);
          } else {
            deviceNotifications.notifyDeviceStatusChange(deviceId, newStatus);
          }
        }
        
        setLatestFrames((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(deviceId) || {};
          newMap.set(deviceId, {
            ...existing,
            status: newStatus,
            last_seen: message.last_seen || message.timestamp
          });
          return newMap;
        });
      } 
      // Other message types
      else {
        console.log(`Received message from device ${deviceId}:`, message);
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err, lastMessage);
    }
  }, [lastMessage, subscribedDevices]);
  
  /**
   * Re-subscribe to all devices when connection is restored
   */
  useEffect(() => {
    if (isConnected && subscribedDevices.size > 0) {
      console.log('Connection restored, re-subscribing to devices...');
      subscribedDevices.forEach((deviceId) => {
        const message = createSubscribeMessage(deviceId);
        sendMessage(message);
      });
    }
  }, [isConnected, subscribedDevices, sendMessage]);
  
  const value = {
    isConnected,
    error,
    connectionAttempts,
    isUnstable,
    subscribe,
    unsubscribe,
    latestFrames,
    subscribedDevices: Array.from(subscribedDevices),
    sendMessage // Expose for custom messages
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
      
      {/* Connection Unstable Warning */}
      {isUnstable && connectionAttempts > 3 && (
        <div className="fixed top-16 right-4 z-50 max-w-md bg-yellow-500/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg border border-yellow-400">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Connection Unstable</p>
              <p className="text-xs mt-1 opacity-90">
                Multiple reconnection attempts ({connectionAttempts}). Check your network connection.
              </p>
            </div>
          </div>
        </div>
      )}
    </WebSocketContext.Provider>
  );
};

/**
 * Custom hook to access WebSocket context
 * @returns {Object} { isConnected, subscribe, unsubscribe, latestFrames, error, subscribedDevices, sendMessage, connectionAttempts, isUnstable }
 */
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
};

export default WebSocketContext;
