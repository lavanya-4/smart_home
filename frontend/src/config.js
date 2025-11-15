/**
 * Frontend Configuration
 */

// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  apiPrefix: '/api/v1',
  wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
};

// Get full API URL
export const getApiUrl = (endpoint) => {
  const url = `${API_CONFIG.baseURL}${API_CONFIG.apiPrefix}${endpoint}`;
  return url;
};

// Get WebSocket URL
export const getWsUrl = (endpoint) => {
  return `${API_CONFIG.wsURL}${endpoint}`;
};

// Auth Configuration
export const AUTH_CONFIG = {
  tokenKey: 'smart_home_token',
  userKey: 'smart_home_user'
};

// Get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem(AUTH_CONFIG.tokenKey);
};

// Set auth token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem(AUTH_CONFIG.tokenKey, token);
};

// Remove auth token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.userKey);
};

// Get auth headers for API requests
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export default API_CONFIG;
