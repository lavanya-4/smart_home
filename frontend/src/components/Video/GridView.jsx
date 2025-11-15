import React, { useState } from 'react';
import LiveFeed from './LiveFeed';
import LiveAudio from '../Audio/LiveAudio';
import FullScreenVideo from './FullScreenVideo';
import { Maximize2, Grid3x3, Circle } from 'lucide-react';

/**
 * GridView Component
 * 
 * Displays multiple device camera feeds in a responsive grid layout.
 * Auto-scales based on number of devices with click-to-expand functionality.
 * 
 * @param {Object} props
 * @param {Array} props.devices - Array of device objects
 * @param {number} props.maxFps - Maximum FPS for each feed (default: 5)
 * 
 * @example
 * const devices = [
 *   { deviceId: 'camera-001', room: 'Living Room', status: 'online' },
 *   { deviceId: 'camera-002', room: 'Bedroom', status: 'online' },
 *   { deviceId: 'camera-003', room: 'Kitchen', status: 'offline' },
 * ];
 * 
 * <GridView devices={devices} maxFps={5} />
 */
const GridView = ({ devices = [], maxFps = 5 }) => {
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine grid layout based on number of devices
  const getGridColumns = () => {
    const count = devices.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  // Handle device click for expansion
  const handleDeviceClick = (device) => {
    setExpandedDevice(device);
    setIsModalOpen(true);
  };

  // Handle closing expanded view
  const handleCloseExpanded = () => {
    setIsModalOpen(false);
    setTimeout(() => setExpandedDevice(null), 300);
  };

  if (!devices || devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-900 border border-slate-800 rounded-lg p-12">
        <Grid3x3 className="h-16 w-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Devices</h3>
        <p className="text-slate-500">Add devices to start monitoring</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid Layout */}
      <div className={`grid ${getGridColumns()} gap-4 w-full`}>
        {devices.map((device) => (
          <div
            key={device.deviceId}
            className="relative group cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleDeviceClick(device)}
          >
            {/* Device Card */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              {/* Room Name Overlay (Top) */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
                      {device.room || device.deviceId}
                    </h3>
                  </div>
                  
                  {/* Status Indicator Dot */}
                  <div className="flex items-center gap-2">
                    <Circle
                      className={`h-3 w-3 ${
                        device.status === 'online'
                          ? 'text-green-500 fill-green-500 animate-pulse'
                          : 'text-gray-500 fill-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* LiveFeed or LiveAudio Component - Based on Device Type */}
              <div className="w-full">
                {device.type?.toLowerCase() === 'microphone' ? (
                  <LiveAudio
                    deviceId={device.deviceId}
                    autoSubscribe={true}
                    autoPlay={true}
                    showMetrics={false}
                  />
                ) : (
                  <LiveFeed
                    deviceId={device.deviceId}
                    autoSubscribe={true}
                    maxFps={maxFps}
                  />
                )}
              </div>

              {/* Expand Overlay (Bottom) - Shows on hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-medium">
                    Click to expand
                  </span>
                  <Maximize2 className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FullScreenVideo Modal */}
      <FullScreenVideo
        device={expandedDevice}
        open={isModalOpen}
        onClose={handleCloseExpanded}
      />
    </>
  );
};

export default GridView;
