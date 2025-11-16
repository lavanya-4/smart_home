import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Info, Maximize2, Circle } from 'lucide-react';
import LiveFeed from './LiveFeed';
import LiveAudio from '../Audio/LiveAudio';
import { useWebSocketContext } from '../../context/WebSocketContext';

/**
 * FullScreenVideo Modal Component
 * 
 * A full-screen modal for displaying a single camera feed with controls.
 * Includes device info overlay, download frame functionality, and ESC key support.
 * 
 * @param {Object} props
 * @param {Object} props.device - Device object with deviceId, room, status, etc.
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * 
 * @example
 * const device = {
 *   deviceId: 'camera-001',
 *   room: 'Living Room',
 *   status: 'online',
 *   location: 'Main Floor',
 *   type: 'PTZ Camera'
 * };
 * 
 * <FullScreenVideo
 *   device={device}
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 */
const FullScreenVideo = ({ device, open, onClose }) => {
  const { latestFrames } = useWebSocketContext();
  const [showInfo, setShowInfo] = useState(false);
  const [fps, setFps] = useState(10);
  const modalRef = useRef(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  // Download current frame
  const handleDownloadFrame = () => {
    if (!device) return;

    const frame = latestFrames.get(device.deviceId);
    if (!frame || !frame.image) {
      console.warn('No frame available to download');
      return;
    }

    try {
      // Create download link
      const imageData = frame.image.startsWith('data:')
        ? frame.image
        : `data:image/jpeg;base64,${frame.image}`;

      const link = document.createElement('a');
      link.href = imageData;
      link.download = `${device.deviceId || 'camera'}_${
        device.room || 'frame'
      }_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Frame downloaded successfully');
    } catch (error) {
      console.error('Failed to download frame:', error);
    }
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!open || !device) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-video-title"
    >
      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full h-full max-w-7xl max-h-[95vh] flex flex-col p-4 md:p-6"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 bg-slate-900/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-xl border border-slate-800">
          {/* Left: Device Info */}
          <div className="flex items-center gap-4">
            <Maximize2 className="h-6 w-6 text-blue-400" />
            <div>
              <h2
                id="fullscreen-video-title"
                className="text-2xl font-bold text-white"
              >
                {device.room || device.deviceId}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <Circle
                    className={`h-3 w-3 ${
                      device.status === 'online'
                        ? 'text-green-500 fill-green-500 animate-pulse'
                        : 'text-gray-500 fill-gray-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      device.status === 'online'
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {device.status || 'Unknown'}
                  </span>
                </div>
                <span className="text-slate-400 text-sm">•</span>
                <span className="text-slate-400 text-sm font-medium">
                  {fps} FPS
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Info Toggle Button */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                showInfo
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              aria-label="Toggle device information"
            >
              <Info className="h-5 w-5" />
              <span className="hidden sm:inline">Info</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadFrame}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all"
              aria-label="Download current frame"
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-all"
              aria-label="Close full screen view"
            >
              <X className="h-5 w-5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Video/Audio Container */}
        <div className="flex-1 relative bg-black rounded-lg overflow-hidden shadow-2xl border border-slate-800">
          {/* LiveFeed or LiveAudio Component */}
          <div className="w-full h-full">
            {device.type?.toLowerCase() === 'microphone' ? (
              <LiveAudio
                deviceId={device.deviceId}
                autoSubscribe={true}
                autoPlay={true}
                showMetrics={true}
              />
            ) : (
              <LiveFeed
                deviceId={device.deviceId}
                autoSubscribe={true}
                maxFps={fps}
              />
            )}
          </div>

          {/* Device Info Overlay (Toggle) */}
          {showInfo && (
            <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md rounded-lg p-6 max-w-md shadow-2xl border border-slate-700 animate-in slide-in-from-left duration-300">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Device Information
              </h3>
              
              <div className="space-y-3 text-sm">
                {/* Device ID */}
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-slate-400 font-medium">Device ID:</span>
                  <span className="text-white font-mono">{device.deviceId}</span>
                </div>

                {/* Room */}
                {device.room && (
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400 font-medium">Room:</span>
                    <span className="text-white">{device.room}</span>
                  </div>
                )}

                {/* Status */}
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span
                    className={`font-semibold ${
                      device.status === 'online'
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {device.status || 'Unknown'}
                  </span>
                </div>

                {/* Location */}
                {device.location && (
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400 font-medium">Location:</span>
                    <span className="text-white">{device.location}</span>
                  </div>
                )}

                {/* Type */}
                {device.type && (
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400 font-medium">Type:</span>
                    <span className="text-white capitalize">{device.type}</span>
                  </div>
                )}

                {/* FPS */}
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-slate-400 font-medium">Frame Rate:</span>
                  <span className="text-white">{fps} FPS</span>
                </div>

                {/* Last Update */}
                {latestFrames.get(device.deviceId)?.timestamp && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Last Update:</span>
                    <span className="text-white text-xs">
                      {new Date(
                        latestFrames.get(device.deviceId).timestamp
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* FPS Control */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <label className="text-slate-400 font-medium text-sm block mb-2">
                  Adjust Frame Rate:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-white font-bold w-12 text-right">
                    {fps}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 FPS</span>
                  <span>30 FPS</span>
                </div>
              </div>
            </div>
          )}

          {/* ESC Hint (Bottom Right) */}
          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-slate-300 text-sm">
            Press <kbd className="px-2 py-1 bg-slate-800 rounded font-mono text-xs">ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenVideo;
