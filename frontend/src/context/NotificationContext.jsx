import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '../components/UI/Snackbar';

/**
 * Notification Context
 * @typedef {Object} Notification
 * @property {string} id - Unique identifier
 * @property {string} message - Notification message
 * @property {string} type - Type: 'info', 'success', 'warning', 'error'
 * @property {number} [duration] - Auto-dismiss duration in ms
 */

/**
 * @typedef {Object} NotificationContextValue
 * @property {Function} showNotification - Show a notification
 * @property {Function} showInfo - Show info notification
 * @property {Function} showSuccess - Show success notification
 * @property {Function} showWarning - Show warning notification
 * @property {Function} showError - Show error notification
 * @property {Function} dismissNotification - Manually dismiss a notification
 * @property {Function} clearAll - Clear all notifications
 */

const NotificationContext = createContext(null);

/**
 * NotificationProvider Component
 * Manages a queue of notifications with max visible limit
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {number} [props.maxVisible=3] - Maximum notifications visible at once
 * @param {number} [props.defaultDuration=4000] - Default auto-dismiss duration
 */
export const NotificationProvider = ({ 
  children, 
  maxVisible = 3,
  defaultDuration = 4000 
}) => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Type: 'info', 'success', 'warning', 'error'
   * @param {number} [duration] - Auto-dismiss duration (default: 4000ms)
   * @returns {string} Notification ID
   */
  const showNotification = useCallback((message, type = 'info', duration = defaultDuration) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    setNotifications(prev => {
      // Add new notification to the end
      const updated = [...prev, notification];
      
      // If we exceed maxVisible, remove oldest notifications
      if (updated.length > maxVisible) {
        return updated.slice(-maxVisible);
      }
      
      return updated;
    });

    return id;
  }, [maxVisible, defaultDuration]);

  /**
   * Show info notification (blue)
   */
  const showInfo = useCallback((message, duration) => {
    return showNotification(message, 'info', duration);
  }, [showNotification]);

  /**
   * Show success notification (green)
   */
  const showSuccess = useCallback((message, duration) => {
    return showNotification(message, 'success', duration);
  }, [showNotification]);

  /**
   * Show warning notification (yellow)
   */
  const showWarning = useCallback((message, duration) => {
    return showNotification(message, 'warning', duration);
  }, [showNotification]);

  /**
   * Show error notification (red)
   */
  const showError = useCallback((message, duration) => {
    return showNotification(message, 'error', duration);
  }, [showNotification]);

  /**
   * Dismiss a specific notification
   * @param {string} id - Notification ID to dismiss
   */
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    showNotification,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    dismissNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render visible notifications */}
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          {notifications.map((notification, index) => (
            <Snackbar
              key={notification.id}
              id={notification.id}
              message={notification.message}
              type={notification.type}
              duration={notification.duration}
              onClose={dismissNotification}
              index={index}
            />
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

/**
 * Hook to access notification context
 * @returns {NotificationContextValue}
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

/**
 * Hook for device event notifications
 * Provides pre-configured notification functions for common device events
 */
export const useDeviceNotifications = () => {
  const { showInfo, showSuccess, showWarning, showError } = useNotifications();

  return {
    /**
     * Show notification when device connects
     * @param {string} deviceId - Device identifier
     * @param {string} [deviceName] - Optional device name
     */
    notifyDeviceConnected: useCallback((deviceId, deviceName) => {
      const name = deviceName || deviceId;
      showSuccess(`Device "${name}" connected`, 4000);
    }, [showSuccess]),

    /**
     * Show notification when device disconnects
     * @param {string} deviceId - Device identifier
     * @param {string} [deviceName] - Optional device name
     */
    notifyDeviceDisconnected: useCallback((deviceId, deviceName) => {
      const name = deviceName || deviceId;
      showWarning(`Device "${name}" disconnected`, 4000);
    }, [showWarning]),

    /**
     * Show notification when new device is added
     * @param {string} deviceId - Device identifier
     * @param {string} [deviceName] - Optional device name
     */
    notifyDeviceAdded: useCallback((deviceId, deviceName) => {
      const name = deviceName || deviceId;
      showSuccess(`New device "${name}" added successfully`, 4000);
    }, [showSuccess]),

    /**
     * Show notification when device is deleted
     * @param {string} deviceId - Device identifier
     * @param {string} [deviceName] - Optional device name
     */
    notifyDeviceDeleted: useCallback((deviceId, deviceName) => {
      const name = deviceName || deviceId;
      showInfo(`Device "${name}" has been deleted`, 4000);
    }, [showInfo]),

    /**
     * Show notification for device error
     * @param {string} deviceId - Device identifier
     * @param {string} error - Error message
     */
    notifyDeviceError: useCallback((deviceId, error) => {
      showError(`Device "${deviceId}": ${error}`, 5000);
    }, [showError]),

    /**
     * Show notification for device status change
     * @param {string} deviceId - Device identifier
     * @param {string} status - New status
     */
    notifyDeviceStatusChange: useCallback((deviceId, status) => {
      showInfo(`Device "${deviceId}" status changed to ${status}`, 4000);
    }, [showInfo])
  };
};

export default NotificationContext;
