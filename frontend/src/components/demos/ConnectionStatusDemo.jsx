import React, { useState, useEffect } from 'react';
import { WebSocketProvider, useWebSocketContext } from '../context/WebSocketContext';
import ConnectionStatus from './ConnectionStatus';
import { RefreshCw, Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Demo component showcasing ConnectionStatus with different states
 */
const ConnectionStatusInner = () => {
  const { 
    isConnected, 
    connectionAttempts, 
    isUnstable, 
    error 
  } = useWebSocketContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            WebSocket Connection Status Demo
          </h1>
          <p className="text-slate-600">
            Enhanced error handling with connection attempts and stability monitoring
          </p>
        </div>

        {/* Live Connection Status */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Live Connection Status</h2>
            <ConnectionStatus 
              isConnected={isConnected}
              connectionAttempts={connectionAttempts}
              isUnstable={isUnstable}
              error={error}
            />
          </div>

          {/* Connection Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection State */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                {isConnected ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="font-semibold text-slate-900">Connection</h3>
              </div>
              <p className="text-2xl font-bold text-slate-700">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>

            {/* Connection Attempts */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className={`h-5 w-5 text-blue-600 ${connectionAttempts > 0 ? 'animate-spin' : ''}`} />
                <h3 className="font-semibold text-slate-900">Attempts</h3>
              </div>
              <p className="text-2xl font-bold text-slate-700">
                {connectionAttempts}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {connectionAttempts > 5 ? 'Notification shown' : 'Normal'}
              </p>
            </div>

            {/* Stability Status */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-5 w-5 ${isUnstable ? 'text-yellow-600' : 'text-slate-400'}`} />
                <h3 className="font-semibold text-slate-900">Stability</h3>
              </div>
              <p className="text-2xl font-bold text-slate-700">
                {isUnstable ? 'Unstable' : 'Stable'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {connectionAttempts > 3 ? 'Warning shown' : 'No issues'}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Enhanced Features</h2>
          
          <div className="space-y-6">
            {/* Exponential Backoff */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Exponential Backoff</h3>
                <p className="text-slate-600 text-sm">
                  Reconnection delay increases exponentially: 3s → 6s → 12s → 24s → 30s (max).
                  Formula: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">Math.min(3000 * 2^attempts, 30000)</code>
                </p>
              </div>
            </div>

            {/* Connection Attempts Tracking */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Info className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Connection Attempts Tracking</h3>
                <p className="text-slate-600 text-sm">
                  Tracks failed connection attempts. Resets to 0 on successful connection.
                  Current attempts: <span className="font-semibold">{connectionAttempts}</span>
                </p>
              </div>
            </div>

            {/* User Notifications */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">User Notifications</h3>
                <p className="text-slate-600 text-sm">
                  After <span className="font-semibold">5 attempts</span>, shows browser notification (if permitted).
                  Dispatches custom event for toast/notification systems.
                </p>
              </div>
            </div>

            {/* Unstable Connection Warning */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Unstable Connection Warning</h3>
                <p className="text-slate-600 text-sm">
                  After <span className="font-semibold">3 attempts</span>, displays yellow warning banner at top of page.
                  Status indicator changes to yellow with AlertTriangle icon.
                </p>
              </div>
            </div>

            {/* Detailed Error Logging */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Detailed Error Logging</h3>
                <p className="text-slate-600 text-sm">
                  All errors logged to console with context: URL, readyState, attempts, timestamp.
                  Distinguishes between clean closes (code 1000) and unexpected disconnections.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example States */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Example States</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connected */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">✅ Connected (Stable)</h3>
              <ConnectionStatus 
                isConnected={true}
                connectionAttempts={0}
                isUnstable={false}
              />
              <p className="text-xs text-slate-600 mt-2">
                Green indicator, stable connection, no issues
              </p>
            </div>

            {/* Reconnecting */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">🔄 Reconnecting (Attempt 2)</h3>
              <ConnectionStatus 
                isConnected={false}
                connectionAttempts={2}
                isUnstable={false}
              />
              <p className="text-xs text-slate-600 mt-2">
                Red indicator, attempting reconnection
              </p>
            </div>

            {/* Unstable */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">⚠️ Unstable (4 Attempts)</h3>
              <ConnectionStatus 
                isConnected={false}
                connectionAttempts={4}
                isUnstable={true}
              />
              <p className="text-xs text-slate-600 mt-2">
                Yellow indicator, warning shown, unstable
              </p>
            </div>

            {/* Critical */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">🚨 Critical (6+ Attempts)</h3>
              <ConnectionStatus 
                isConnected={false}
                connectionAttempts={6}
                isUnstable={true}
                error="Failed to connect after 6 attempts"
              />
              <p className="text-xs text-slate-600 mt-2">
                Yellow indicator, notification sent to user
              </p>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• <strong>Test Reconnection:</strong> Stop the backend server to see reconnection attempts</li>
                <li>• <strong>Test Unstable Warning:</strong> After 3 failed attempts, yellow banner appears</li>
                <li>• <strong>Test Notifications:</strong> After 5 attempts, check browser notifications</li>
                <li>• <strong>Test Recovery:</strong> Restart backend to see successful reconnection and reset</li>
                <li>• <strong>Monitor Console:</strong> All errors and attempts are logged with detailed context</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Demo wrapper with WebSocketProvider
 */
const ConnectionStatusDemo = () => {
  return (
    <WebSocketProvider url="ws://localhost:8000/ws">
      <ConnectionStatusInner />
    </WebSocketProvider>
  );
};

export default ConnectionStatusDemo;
