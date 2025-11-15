import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing WebSocket connections with auto-reconnect and comprehensive error handling
 * @param {string} url - WebSocket endpoint URL (e.g., 'ws://localhost:8000/ws')
 * @returns {Object} { isConnected, lastMessage, sendMessage, error, connectionAttempts, isUnstable }
 */
export const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isUnstable, setIsUnstable] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const notificationShownRef = useRef(false);
  
  // Maximum reconnect attempts before giving up
  const MAX_RECONNECT_ATTEMPTS = 10;
  const UNSTABLE_THRESHOLD = 3;
  const NOTIFICATION_THRESHOLD = 5;
  
  // Calculate exponential backoff delay: 3s, 6s, 12s, 24s, 30s (capped)
  const getReconnectDelay = useCallback((attempts) => {
    const baseDelay = 3000; // 3 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempts), 30000); // Max 30 seconds
    return delay;
  }, []);
  
  // Show user notification for connection issues
  const showNotification = useCallback((message, type = 'error') => {
    console.warn(`[WebSocket Notification] ${message}`);
    
    // In a real app, you would integrate with a notification system
    // For now, we'll use console and could trigger a toast/alert
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('WebSocket Connection', {
          body: message,
          icon: type === 'error' ? '⚠️' : 'ℹ️'
        });
      }
    }
    
    // Could also dispatch a custom event that a notification component listens to
    window.dispatchEvent(new CustomEvent('websocket-notification', {
      detail: { message, type, timestamp: Date.now() }
    }));
  }, []);
  
  // Send message function
  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        wsRef.current.send(message);
        return true;
      } catch (err) {
        console.error('Failed to send message:', err);
        setError(`Failed to send message: ${err.message}`);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected');
      setError('WebSocket is not connected');
      return false;
    }
  }, []);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!url) {
      console.error('WebSocket URL is required');
      return;
    }
    
    try {
      console.log(`Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        
        // Reset connection attempts on successful connection
        setConnectionAttempts(0);
        setIsUnstable(false);
        notificationShownRef.current = false;
        
        // Show success notification if recovering from errors
        if (connectionAttempts > 0) {
          console.log(`Connection restored after ${connectionAttempts} attempts`);
          showNotification('Connection restored successfully', 'success');
        }
      };
      
      ws.onmessage = (event) => {
        try {
          // Try to parse as JSON, fallback to raw data
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (err) {
          // If not JSON, store raw message
          setLastMessage(event.data);
        }
      };
      
      ws.onerror = (event) => {
        const errorMsg = `WebSocket error occurred (attempt ${connectionAttempts + 1})`;
        console.error(errorMsg, event);
        
        // Log detailed error information
        console.error('Error details:', {
          url,
          readyState: ws.readyState,
          attempts: connectionAttempts,
          timestamp: new Date().toISOString()
        });
        
        // Increment connection attempts
        const newAttempts = connectionAttempts + 1;
        setConnectionAttempts(newAttempts);
        setError(errorMsg);
        
        // Check if connection is unstable (more than 3 attempts)
        if (newAttempts > UNSTABLE_THRESHOLD) {
          setIsUnstable(true);
          console.warn('Connection is unstable - multiple reconnection attempts detected');
        }
        
        // Show user notification after 5 failed attempts
        if (newAttempts > NOTIFICATION_THRESHOLD && !notificationShownRef.current) {
          notificationShownRef.current = true;
          showNotification(
            `Unable to establish stable connection after ${newAttempts} attempts. Retrying...`,
            'error'
          );
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          attempts: connectionAttempts
        });
        
        setIsConnected(false);
        wsRef.current = null;
        
        // Don't increment attempts if connection was clean (user initiated)
        if (!event.wasClean && event.code !== 1000) {
          const newAttempts = connectionAttempts + 1;
          setConnectionAttempts(newAttempts);
          
          // Log error to console
          console.error(`Connection closed unexpectedly (attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS})`, {
            code: event.code,
            reason: event.reason || 'No reason provided'
          });
          
          // Check if connection is unstable
          if (newAttempts > UNSTABLE_THRESHOLD) {
            setIsUnstable(true);
          }
          
          // Show notification after threshold
          if (newAttempts > NOTIFICATION_THRESHOLD && !notificationShownRef.current) {
            notificationShownRef.current = true;
            showNotification(
              `Connection lost after ${newAttempts} attempts. Trying to reconnect...`,
              'error'
            );
          }
        }
        
        // Attempt to reconnect if not manually closed and haven't exceeded max attempts
        if (shouldReconnectRef.current && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay(connectionAttempts);
          console.log(`Reconnecting in ${delay}ms... (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          setError(`Reconnecting in ${Math.round(delay / 1000)}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          const errorMsg = `Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`;
          setError(errorMsg);
          console.error('Max reconnect attempts reached');
          showNotification(errorMsg, 'error');
        }
      };
      
      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError(`Failed to create WebSocket: ${err.message}`);
    }
  }, [url, getReconnectDelay]);
  
  // Connect on mount
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    
    // Cleanup on unmount
    return () => {
      shouldReconnectRef.current = false;
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket connection
      if (wsRef.current) {
        console.log('Closing WebSocket connection');
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [connect]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage,
    error,
    connectionAttempts,
    isUnstable
  };
};

export default useWebSocket;
