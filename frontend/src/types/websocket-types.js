/**
 * @fileoverview WebSocket Message Type Definitions (JSDoc)
 * 
 * This file provides JSDoc type definitions for WebSocket messages
 * used in the Smart Home IoT system. Import these types using JSDoc comments.
 * 
 * @example
 * // Import in your JS file:
 * /// <reference path="./websocket-types.js" />
 * 
 * // Use in JSDoc comments:
 * /** @type {ClientMessage} *\/
 * const message = { action: "subscribe", device_id: "camera-001" };
 */

// ============================================================
// Client -> Server Messages
// ============================================================

/**
 * @typedef {Object} SubscribeMessage
 * @property {"subscribe"} action - Action type
 * @property {string} device_id - Device ID to subscribe to
 * @property {string} [timestamp] - Optional timestamp
 */

/**
 * @typedef {Object} UnsubscribeMessage
 * @property {"unsubscribe"} action - Action type
 * @property {string} device_id - Device ID to unsubscribe from
 * @property {string} [timestamp] - Optional timestamp
 */

/**
 * @typedef {Object} PingMessage
 * @property {"ping"} action - Action type
 * @property {string} [timestamp] - Optional timestamp
 */

/**
 * @typedef {Object} StatsMessage
 * @property {"stats"} action - Action type
 * @property {string} [timestamp] - Optional timestamp
 */

/**
 * @typedef {SubscribeMessage | UnsubscribeMessage | PingMessage | StatsMessage} ClientMessage
 * Union type for all client-to-server messages
 */

// ============================================================
// Server -> Client Messages
// ============================================================

/**
 * @typedef {Object} FrameMetadata
 * @property {string} [device_type] - Type of device (e.g., "camera")
 * @property {string} [location] - Device location/room
 * @property {string} [resolution] - Image resolution (e.g., "640x480")
 * @property {number} [quality] - JPEG quality level (0-100)
 */

/**
 * @typedef {Object} FrameMessage
 * @property {"frame"} type - Message type
 * @property {string} device_id - Device ID
 * @property {string} image - Base64 encoded JPEG image
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {FrameMetadata} [metadata] - Optional metadata
 */

/**
 * @typedef {Object} StatusMessage
 * @property {"status"} type - Message type
 * @property {string} device_id - Device ID
 * @property {"online" | "offline"} status - Device status
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} [last_seen] - Last seen timestamp
 * @property {Object} [metadata] - Optional metadata
 */

/**
 * @typedef {Object} ErrorMessage
 * @property {"error"} type - Message type
 * @property {string} message - Error message
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} [code] - Error code
 * @property {string} [device_id] - Optional device ID if error is device-specific
 */

/**
 * @typedef {Object} ConnectionMessage
 * @property {"connection"} type - Message type
 * @property {"connected" | "disconnected"} status - Connection status
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} [message] - Optional status message
 * @property {string} [client_id] - Optional client ID
 */

/**
 * @typedef {Object} AlertMessage
 * @property {"alert"} type - Message type
 * @property {string} device_id - Device ID
 * @property {string} alert - Alert message
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {"info" | "warning" | "error" | "critical"} [severity] - Alert severity
 * @property {Object} [metadata] - Optional metadata
 */

/**
 * @typedef {Object} PongMessage
 * @property {"pong"} type - Message type
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} [message] - Optional message
 */

/**
 * @typedef {Object} StatsResponseMessage
 * @property {"stats"} type - Message type
 * @property {number} total_connections - Total active connections
 * @property {Object.<string, number>} subscriptions - Device subscriptions map
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {number} [uptime] - Server uptime in seconds
 */

/**
 * @typedef {FrameMessage | StatusMessage | ErrorMessage | ConnectionMessage | AlertMessage | PongMessage | StatsResponseMessage} ServerMessage
 * Union type for all server-to-client messages
 */

// ============================================================
// Utility Types
// ============================================================

/**
 * @typedef {Object} DeviceFrame
 * @property {string} image - Base64 encoded image
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {FrameMetadata} [metadata] - Frame metadata
 * @property {string} [alert] - Alert message if present
 * @property {string} [alertTimestamp] - Alert timestamp if present
 */

/**
 * @typedef {"connecting" | "connected" | "disconnected" | "error"} ConnectionState
 */

/**
 * @typedef {Object} UseWebSocketReturn
 * @property {boolean} isConnected - Connection status
 * @property {ServerMessage | null} lastMessage - Last received message
 * @property {(data: ClientMessage | string) => boolean} sendMessage - Send message function
 * @property {string | null} error - Error message if any
 */

/**
 * @typedef {Object} WebSocketContextValue
 * @property {boolean} isConnected - Connection status
 * @property {string | null} error - Error message if any
 * @property {(deviceId: string) => void} subscribe - Subscribe to device updates
 * @property {(deviceId: string) => void} unsubscribe - Unsubscribe from device updates
 * @property {Map<string, DeviceFrame>} latestFrames - Map of device frames
 * @property {string[]} subscribedDevices - Array of subscribed device IDs
 * @property {(data: ClientMessage | string) => boolean} sendMessage - Send message function
 */

// ============================================================
// Constants
// ============================================================

/**
 * Valid client message actions
 * @enum {string}
 */
export const CLIENT_ACTIONS = {
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  PING: "ping",
  STATS: "stats",
};

/**
 * Valid server message types
 * @enum {string}
 */
export const SERVER_MESSAGE_TYPES = {
  FRAME: "frame",
  STATUS: "status",
  ERROR: "error",
  CONNECTION: "connection",
  ALERT: "alert",
  PONG: "pong",
  STATS: "stats",
};

/**
 * Device status values
 * @enum {string}
 */
export const DEVICE_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
};

/**
 * Connection status values
 * @enum {string}
 */
export const CONNECTION_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};

/**
 * Alert severity levels
 * @enum {string}
 */
export const ALERT_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

// ============================================================
// Type Guards / Validators
// ============================================================

/**
 * Check if a message is a FrameMessage
 * @param {any} message - Message to check
 * @returns {boolean} True if message is a FrameMessage
 */
export function isFrameMessage(message) {
  return message && message.type === "frame" && typeof message.device_id === "string";
}

/**
 * Check if a message is a StatusMessage
 * @param {any} message - Message to check
 * @returns {boolean} True if message is a StatusMessage
 */
export function isStatusMessage(message) {
  return message && message.type === "status" && typeof message.device_id === "string";
}

/**
 * Check if a message is an ErrorMessage
 * @param {any} message - Message to check
 * @returns {boolean} True if message is an ErrorMessage
 */
export function isErrorMessage(message) {
  return message && message.type === "error" && typeof message.message === "string";
}

/**
 * Check if a message is a ConnectionMessage
 * @param {any} message - Message to check
 * @returns {boolean} True if message is a ConnectionMessage
 */
export function isConnectionMessage(message) {
  return message && message.type === "connection" && typeof message.status === "string";
}

/**
 * Check if a message is an AlertMessage
 * @param {any} message - Message to check
 * @returns {boolean} True if message is an AlertMessage
 */
export function isAlertMessage(message) {
  return message && message.type === "alert" && typeof message.device_id === "string";
}

/**
 * Validate client message structure
 * @param {ClientMessage} message - Message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If message is invalid
 */
export function validateClientMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }
  
  if (!message.action || typeof message.action !== 'string') {
    throw new Error('Message must have a valid action');
  }
  
  const validActions = Object.values(CLIENT_ACTIONS);
  if (!validActions.includes(message.action)) {
    throw new Error(`Invalid action: ${message.action}. Must be one of: ${validActions.join(', ')}`);
  }
  
  // Check device_id for subscribe/unsubscribe
  if ((message.action === 'subscribe' || message.action === 'unsubscribe') && !message.device_id) {
    throw new Error(`${message.action} message must include device_id`);
  }
  
  return true;
}

/**
 * Create a subscribe message
 * @param {string} deviceId - Device ID to subscribe to
 * @returns {SubscribeMessage}
 */
export function createSubscribeMessage(deviceId) {
  return {
    action: CLIENT_ACTIONS.SUBSCRIBE,
    device_id: deviceId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an unsubscribe message
 * @param {string} deviceId - Device ID to unsubscribe from
 * @returns {UnsubscribeMessage}
 */
export function createUnsubscribeMessage(deviceId) {
  return {
    action: CLIENT_ACTIONS.UNSUBSCRIBE,
    device_id: deviceId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a ping message
 * @returns {PingMessage}
 */
export function createPingMessage() {
  return {
    action: CLIENT_ACTIONS.PING,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a stats request message
 * @returns {StatsMessage}
 */
export function createStatsMessage() {
  return {
    action: CLIENT_ACTIONS.STATS,
    timestamp: new Date().toISOString()
  };
}
