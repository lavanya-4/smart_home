import { useEffect, useRef } from 'react';
import { useDeviceNotifications } from '../context/NotificationContext';

/**
 * Hook to automatically show notifications for WebSocket events
 * Listens to custom events dispatched from useWebSocket hook
 * 
 * @param {boolean} [enabled=true] - Enable/disable automatic notifications
 */
export const useWebSocketNotifications = (enabled = true) => {
  const deviceNotifications = useDeviceNotifications();
  const notificationShownRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    /**
     * Handle WebSocket notification events
     * @param {CustomEvent} event - Event with detail: { message, type, timestamp }
     */
    const handleWebSocketNotification = (event) => {
      const { message, type } = event.detail;
      
      // Show notification based on type
      if (type === 'error' && !notificationShownRef.current) {
        // Prevent duplicate error notifications
        notificationShownRef.current = true;
        
        // Use deviceNotifications.notifyDeviceError or show generic error
        // For now, we'll dispatch it through window for the NotificationProvider to catch
        console.log('WebSocket error notification:', message);
        
        // Reset after 5 seconds
        setTimeout(() => {
          notificationShownRef.current = false;
        }, 5000);
      }
    };

    // Listen for WebSocket notification events
    window.addEventListener('websocket-notification', handleWebSocketNotification);

    return () => {
      window.removeEventListener('websocket-notification', handleWebSocketNotification);
    };
  }, [enabled, deviceNotifications]);
};

/**
 * Hook to show notifications for device list changes
 * Use this in components that manage device lists (add/remove devices)
 */
export const useDeviceListNotifications = () => {
  const {
    notifyDeviceAdded,
    notifyDeviceDeleted,
    notifyDeviceError
  } = useDeviceNotifications();

  return {
    /**
     * Show notification when device is successfully added
     * @param {Object} device - Device object with id and name
     */
    onDeviceAdded: (device) => {
      notifyDeviceAdded(device.deviceId || device.id, device.name || device.room);
    },

    /**
     * Show notification when device is deleted
     * @param {Object} device - Device object with id and name
     */
    onDeviceDeleted: (device) => {
      notifyDeviceDeleted(device.deviceId || device.id, device.name || device.room);
    },

    /**
     * Show notification when device operation fails
     * @param {Object} device - Device object with id
     * @param {string} error - Error message
     */
    onDeviceError: (device, error) => {
      notifyDeviceError(device.deviceId || device.id, error);
    }
  };
};

export default useWebSocketNotifications;
