import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

/**
 * Snackbar Component
 * Displays temporary notification messages with auto-dismiss
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the notification
 * @param {string} props.message - Notification message text
 * @param {string} props.type - Type: 'info', 'success', 'warning', 'error' (default: 'info')
 * @param {number} props.duration - Auto-dismiss duration in ms (default: 4000)
 * @param {Function} props.onClose - Callback when notification is closed
 * @param {number} props.index - Position index for stacking (0 = bottom)
 */
const Snackbar = ({ 
  id,
  message, 
  type = 'info', 
  duration = 4000, 
  onClose,
  index = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  // Handle close with exit animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  // Get styles based on type
  const getStyles = () => {
    const styles = {
      info: {
        bg: 'bg-blue-600',
        border: 'border-blue-500',
        icon: Info,
        iconColor: 'text-blue-100'
      },
      success: {
        bg: 'bg-green-600',
        border: 'border-green-500',
        icon: CheckCircle,
        iconColor: 'text-green-100'
      },
      warning: {
        bg: 'bg-yellow-600',
        border: 'border-yellow-500',
        icon: AlertTriangle,
        iconColor: 'text-yellow-100'
      },
      error: {
        bg: 'bg-red-600',
        border: 'border-red-500',
        icon: XCircle,
        iconColor: 'text-red-100'
      }
    };

    return styles[type] || styles.info;
  };

  const style = getStyles();
  const Icon = style.icon;

  // Calculate vertical position based on index
  const bottomPosition = 16 + (index * 80); // 16px base + 80px per notification

  return (
    <div
      className={`
        fixed right-4 z-50
        flex items-center gap-3
        ${style.bg} border-l-4 ${style.border}
        text-white rounded-lg shadow-2xl
        px-4 py-3 min-w-[320px] max-w-md
        transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-[120%] opacity-0'
        }
      `}
      style={{ bottom: `${bottomPosition}px` }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon className={`h-5 w-5 ${style.iconColor}`} />
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-white/40 animate-progress"
            style={{
              animation: `progress ${duration}ms linear`
            }}
          />
        </div>
      )}

      {/* CSS for progress animation */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress ${duration}ms linear;
        }
      `}</style>
    </div>
  );
};

export default Snackbar;
