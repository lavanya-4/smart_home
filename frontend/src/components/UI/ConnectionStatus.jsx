import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

/**
 * ConnectionStatus Component
 * Displays WebSocket connection status with connection attempts and warnings
 * 
 * @param {Object} props
 * @param {boolean} props.isConnected - WebSocket connection status
 * @param {number} [props.connectionAttempts=0] - Number of connection attempts
 * @param {boolean} [props.isUnstable=false] - Whether connection is unstable
 * @param {string} [props.error=null] - Error message if any
 * @returns {JSX.Element}
 */
const ConnectionStatus = ({ 
  isConnected, 
  connectionAttempts = 0, 
  isUnstable = false,
  error = null 
}) => {
  // Determine status color and style
  const getStatusStyle = () => {
    if (isConnected && !isUnstable) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        dotBg: 'bg-green-400',
        dotSolid: 'bg-green-500',
        duration: '2s'
      };
    } else if (isUnstable && connectionAttempts > 3) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        dotBg: 'bg-yellow-400',
        dotSolid: 'bg-yellow-500',
        duration: '1.2s'
      };
    } else {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dotBg: 'bg-red-400',
        dotSolid: 'bg-red-500',
        duration: '1.5s'
      };
    }
  };

  const style = getStatusStyle();
  
  // Get status text
  const getStatusText = () => {
    if (isConnected && !isUnstable) {
      return 'Connected';
    } else if (isUnstable && connectionAttempts > 3) {
      return `Unstable (${connectionAttempts} attempts)`;
    } else if (connectionAttempts > 0) {
      return `Reconnecting (${connectionAttempts})...`;
    } else {
      return 'Reconnecting...';
    }
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-300 ease-in-out
        ${style.bg} ${style.text} border ${style.border}
      `}
      role="status"
      aria-live="polite"
      aria-label={getStatusText()}
      title={error || getStatusText()}
    >
      {/* Animated Status Dot */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Ring Animation */}
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${style.dotBg}`}
          style={{ animationDuration: style.duration }}
        />
        
        {/* Solid Dot */}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.dotSolid}`} />
      </div>

      {/* Status Icon */}
      {isConnected && !isUnstable ? (
        <Wifi className="h-4 w-4" />
      ) : isUnstable ? (
        <AlertTriangle className="h-4 w-4 animate-pulse" />
      ) : (
        <WifiOff className="h-4 w-4 animate-pulse" />
      )}

      {/* Status Text */}
      <span className="font-semibold">
        {getStatusText()}
      </span>
      
      {/* Show error message tooltip on hover if available */}
      {error && (
        <div className="hidden group-hover:block absolute top-full mt-2 left-0 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
