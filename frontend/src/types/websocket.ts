/**
 * WebSocket Message Type Definitions
 * 
 * This file defines TypeScript interfaces for all WebSocket messages
 * exchanged between the client and server in the Smart Home IoT system.
 */

// ============================================================
// Client -> Server Messages
// ============================================================

/**
 * Base interface for all client-to-server messages
 */
interface ClientMessageBase {
  timestamp?: string;
}

/**
 * Subscribe to device updates
 */
export interface SubscribeMessage extends ClientMessageBase {
  action: "subscribe";
  device_id: string;
}

/**
 * Unsubscribe from device updates
 */
export interface UnsubscribeMessage extends ClientMessageBase {
  action: "unsubscribe";
  device_id: string;
}

/**
 * Ping message to keep connection alive
 */
export interface PingMessage extends ClientMessageBase {
  action: "ping";
}

/**
 * Request statistics about WebSocket connections
 */
export interface StatsMessage extends ClientMessageBase {
  action: "stats";
}

/**
 * Union type for all client-to-server messages
 */
export type ClientMessage = 
  | SubscribeMessage 
  | UnsubscribeMessage 
  | PingMessage 
  | StatsMessage;

// ============================================================
// Server -> Client Messages
// ============================================================

/**
 * Base interface for all server-to-client messages
 */
interface ServerMessageBase {
  timestamp: string;
}

/**
 * Camera frame data from IoT device
 */
export interface FrameMessage extends ServerMessageBase {
  type: "frame";
  device_id: string;
  image: string; // Base64 encoded JPEG image
  metadata?: {
    device_type?: string;
    location?: string;
    resolution?: string;
    quality?: number;
    [key: string]: any;
  };
}

/**
 * Device status update (online/offline)
 */
export interface StatusMessage extends ServerMessageBase {
  type: "status";
  device_id: string;
  status: "online" | "offline";
  last_seen?: string;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Error message from server
 */
export interface ErrorMessage extends ServerMessageBase {
  type: "error";
  message: string;
  code?: string;
  device_id?: string;
}

/**
 * Connection status change
 */
export interface ConnectionMessage extends ServerMessageBase {
  type: "connection";
  status: "connected" | "disconnected";
  message?: string;
  client_id?: string;
}

/**
 * Alert/notification from device or system
 */
export interface AlertMessage extends ServerMessageBase {
  type: "alert";
  device_id: string;
  alert: string;
  severity?: "info" | "warning" | "error" | "critical";
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Pong response to ping
 */
export interface PongMessage extends ServerMessageBase {
  type: "pong";
  message?: string;
}

/**
 * Statistics about WebSocket connections
 */
export interface StatsResponseMessage extends ServerMessageBase {
  type: "stats";
  total_connections: number;
  subscriptions: {
    [device_id: string]: number; // number of subscribers per device
  };
  uptime?: number;
}

/**
 * Union type for all server-to-client messages
 */
export type ServerMessage = 
  | FrameMessage 
  | StatusMessage 
  | ErrorMessage 
  | ConnectionMessage 
  | AlertMessage 
  | PongMessage 
  | StatsResponseMessage;

// ============================================================
// Utility Types
// ============================================================

/**
 * Device frame data stored in context
 */
export interface DeviceFrame {
  image: string;
  timestamp: string;
  metadata?: {
    type?: string;
    device_type?: string;
    location?: string;
    resolution?: string;
    quality?: number;
    [key: string]: any;
  };
  alert?: string;
  alertTimestamp?: string;
}

/**
 * WebSocket connection state
 */
export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

/**
 * WebSocket hook return type
 */
export interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: ServerMessage | null;
  sendMessage: (data: ClientMessage | string) => boolean;
  error: string | null;
}

/**
 * WebSocket context value type
 */
export interface WebSocketContextValue {
  isConnected: boolean;
  error: string | null;
  subscribe: (deviceId: string) => void;
  unsubscribe: (deviceId: string) => void;
  latestFrames: Map<string, DeviceFrame>;
  subscribedDevices: string[];
  sendMessage: (data: ClientMessage | string) => boolean;
}

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard to check if a message is a FrameMessage
 */
export function isFrameMessage(message: any): message is FrameMessage {
  return message && message.type === "frame" && typeof message.device_id === "string";
}

/**
 * Type guard to check if a message is a StatusMessage
 */
export function isStatusMessage(message: any): message is StatusMessage {
  return message && message.type === "status" && typeof message.device_id === "string";
}

/**
 * Type guard to check if a message is an ErrorMessage
 */
export function isErrorMessage(message: any): message is ErrorMessage {
  return message && message.type === "error" && typeof message.message === "string";
}

/**
 * Type guard to check if a message is a ConnectionMessage
 */
export function isConnectionMessage(message: any): message is ConnectionMessage {
  return message && message.type === "connection" && typeof message.status === "string";
}

/**
 * Type guard to check if a message is an AlertMessage
 */
export function isAlertMessage(message: any): message is AlertMessage {
  return message && message.type === "alert" && typeof message.device_id === "string";
}

// ============================================================
// Constants
// ============================================================

/**
 * Valid client message actions
 */
export const CLIENT_ACTIONS = {
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  PING: "ping",
  STATS: "stats",
} as const;

/**
 * Valid server message types
 */
export const SERVER_MESSAGE_TYPES = {
  FRAME: "frame",
  STATUS: "status",
  ERROR: "error",
  CONNECTION: "connection",
  ALERT: "alert",
  PONG: "pong",
  STATS: "stats",
} as const;

/**
 * Device status values
 */
export const DEVICE_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
} as const;

/**
 * Connection status values
 */
export const CONNECTION_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
} as const;

/**
 * Alert severity levels
 */
export const ALERT_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
} as const;
