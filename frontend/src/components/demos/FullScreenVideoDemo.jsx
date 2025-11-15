import React, { useState } from 'react';
import { WebSocketProvider } from '../context/WebSocketContext';
import FullScreenVideo from './FullScreenVideo';
import { Maximize2, Video } from 'lucide-react';

/**
 * FullScreenVideo Demo Component
 * 
 * Demonstrates the FullScreenVideo modal component with various device examples.
 */
const FullScreenVideoDemo = () => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample devices
  const devices = [
    {
      deviceId: 'camera-001',
      room: 'Living Room',
      status: 'online',
      location: 'Main Floor',
      type: 'PTZ Camera',
    },
    {
      deviceId: 'camera-002',
      room: 'Bedroom',
      status: 'online',
      location: 'Second Floor',
      type: 'Fixed Camera',
    },
    {
      deviceId: 'camera-003',
      room: 'Kitchen',
      status: 'online',
      location: 'Main Floor',
      type: 'Wide Angle Camera',
    },
    {
      deviceId: 'camera-004',
      room: 'Garage',
      status: 'offline',
      location: 'Ground Level',
      type: 'Outdoor Camera',
    },
    {
      deviceId: 'camera-005',
      room: 'Front Door',
      status: 'online',
      location: 'Entrance',
      type: 'Doorbell Camera',
    },
  ];

  // Open modal with selected device
  const handleOpenModal = (device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Keep device selected for a brief moment before clearing
    setTimeout(() => setSelectedDevice(null), 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Full Screen Video Modal
          </h1>
          <p className="text-slate-400">
            Click any device to view in full-screen mode with controls
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-white">Full Screen View</p>
                <p className="text-sm text-slate-400">
                  Large LiveFeed with minimal UI
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-white">Device Info Overlay</p>
                <p className="text-sm text-slate-400">
                  Toggle device details and adjust FPS
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-white">Download Frame</p>
                <p className="text-sm text-slate-400">
                  Save current frame as JPEG
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <p className="font-semibold text-white">ESC to Close</p>
                <p className="text-sm text-slate-400">
                  Keyboard shortcut support
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Device Cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Select a Device</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => handleOpenModal(device)}
                className="group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-blue-500 rounded-lg p-6 text-left transition-all hover:shadow-lg hover:shadow-blue-500/20"
              >
                {/* Status Indicator */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      device.status === 'online'
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-500'
                    }`}
                  />
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                    <Video className="h-6 w-6 text-blue-400" />
                  </div>
                </div>

                {/* Device Info */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {device.room}
                </h3>
                <p className="text-sm text-slate-400 mb-1">
                  {device.location}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {device.deviceId}
                </p>

                {/* View Button Hint */}
                <div className="mt-4 flex items-center gap-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">View Full Screen</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Keyboard Shortcuts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 text-slate-300">
              <kbd className="px-3 py-2 bg-slate-800 rounded-lg font-mono text-sm border border-slate-700">
                ESC
              </kbd>
              <span className="text-sm">Close modal</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <kbd className="px-3 py-2 bg-slate-800 rounded-lg font-mono text-sm border border-slate-700">
                Click backdrop
              </kbd>
              <span className="text-sm">Close modal</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Total Devices</div>
            <div className="text-white text-3xl font-bold">{devices.length}</div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Online Devices</div>
            <div className="text-green-400 text-3xl font-bold">
              {devices.filter((d) => d.status === 'online').length}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Current View</div>
            <div className="text-blue-400 text-3xl font-bold">
              {isModalOpen ? '1' : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* FullScreenVideo Modal */}
      <FullScreenVideo
        device={selectedDevice}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

// Wrapper with WebSocket provider
const FullScreenVideoDemoWithProvider = () => {
  return (
    <WebSocketProvider url="ws://localhost:8000/ws">
      <FullScreenVideoDemo />
    </WebSocketProvider>
  );
};

export default FullScreenVideoDemoWithProvider;
