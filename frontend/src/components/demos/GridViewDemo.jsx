import React, { useState } from 'react';
import { WebSocketProvider } from '../context/WebSocketContext';
import GridView from './GridView';
import { Plus, Trash2, Grid3x3, List } from 'lucide-react';

/**
 * GridView Demo Component
 * 
 * Demonstrates the GridView component with multiple device feeds
 * in a responsive grid layout.
 */
const GridViewDemo = () => {
  // Sample devices data
  const [devices, setDevices] = useState([
    {
      deviceId: 'camera-001',
      room: 'Living Room',
      location: 'Main Floor',
      type: 'camera',
      status: 'online',
    },
    {
      deviceId: 'camera-002',
      room: 'Bedroom',
      location: 'Second Floor',
      type: 'camera',
      status: 'online',
    },
    {
      deviceId: 'camera-003',
      room: 'Kitchen',
      location: 'Main Floor',
      type: 'camera',
      status: 'online',
    },
    {
      deviceId: 'camera-004',
      room: 'Garage',
      location: 'Ground Floor',
      type: 'camera',
      status: 'offline',
    },
  ]);

  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    room: '',
  });

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Add new device
  const handleAddDevice = () => {
    if (newDevice.deviceId.trim() && newDevice.room.trim()) {
      setDevices([
        ...devices,
        {
          ...newDevice,
          deviceId: newDevice.deviceId.trim(),
          room: newDevice.room.trim(),
          location: 'Unknown',
          type: 'camera',
          status: 'online',
        },
      ]);
      setNewDevice({ deviceId: '', room: '' });
    }
  };

  // Remove device
  const handleRemoveDevice = (deviceId) => {
    setDevices(devices.filter((d) => d.deviceId !== deviceId));
  };

  // Preset device counts for demo
  const loadPreset = (count) => {
    const presets = {
      1: [
        { deviceId: 'camera-001', room: 'Living Room', status: 'online' },
      ],
      2: [
        { deviceId: 'camera-001', room: 'Living Room', status: 'online' },
        { deviceId: 'camera-002', room: 'Bedroom', status: 'online' },
      ],
      4: [
        { deviceId: 'camera-001', room: 'Living Room', status: 'online' },
        { deviceId: 'camera-002', room: 'Bedroom', status: 'online' },
        { deviceId: 'camera-003', room: 'Kitchen', status: 'online' },
        { deviceId: 'camera-004', room: 'Garage', status: 'offline' },
      ],
      6: [
        { deviceId: 'camera-001', room: 'Living Room', status: 'online' },
        { deviceId: 'camera-002', room: 'Bedroom', status: 'online' },
        { deviceId: 'camera-003', room: 'Kitchen', status: 'online' },
        { deviceId: 'camera-004', room: 'Garage', status: 'offline' },
        { deviceId: 'camera-005', room: 'Backyard', status: 'online' },
        { deviceId: 'camera-006', room: 'Front Door', status: 'online' },
      ],
      9: [
        { deviceId: 'camera-001', room: 'Living Room', status: 'online' },
        { deviceId: 'camera-002', room: 'Bedroom', status: 'online' },
        { deviceId: 'camera-003', room: 'Kitchen', status: 'online' },
        { deviceId: 'camera-004', room: 'Garage', status: 'offline' },
        { deviceId: 'camera-005', room: 'Backyard', status: 'online' },
        { deviceId: 'camera-006', room: 'Front Door', status: 'online' },
        { deviceId: 'camera-007', room: 'Basement', status: 'online' },
        { deviceId: 'camera-008', room: 'Office', status: 'online' },
        { deviceId: 'camera-009', room: 'Attic', status: 'offline' },
      ],
    };
    setDevices(presets[count] || presets[4]);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Device Grid View
              </h1>
              <p className="text-slate-400">
                Responsive multi-camera monitoring dashboard
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Grid3x3 className="h-5 w-5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <List className="h-5 w-5" />
                List
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Total Devices</div>
              <div className="text-white text-3xl font-bold">{devices.length}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Online</div>
              <div className="text-green-400 text-3xl font-bold">
                {devices.filter((d) => d.status === 'online').length}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Offline</div>
              <div className="text-red-400 text-3xl font-bold">
                {devices.filter((d) => d.status === 'offline').length}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          {/* Add New Device */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Add Device</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newDevice.deviceId}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, deviceId: e.target.value })
                }
                placeholder="Device ID (e.g., camera-010)"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newDevice.room}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, room: e.target.value })
                }
                placeholder="Room name (e.g., Hallway)"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddDevice}
                disabled={!newDevice.deviceId.trim() || !newDevice.room.trim()}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                  newDevice.deviceId.trim() && newDevice.room.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="h-5 w-5" />
                Add
              </button>
            </div>
          </div>

          {/* Preset Layouts */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Load Preset</h3>
            <div className="flex gap-2">
              {[1, 2, 4, 6, 9].map((count) => (
                <button
                  key={count}
                  onClick={() => loadPreset(count)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
                >
                  {count} {count === 1 ? 'Device' : 'Devices'}
                </button>
              ))}
            </div>
          </div>

          {/* Device List */}
          {devices.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Current Devices ({devices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          device.status === 'online'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      <div>
                        <div className="text-white font-medium text-sm">
                          {device.room}
                        </div>
                        <div className="text-slate-400 text-xs font-mono">
                          {device.deviceId}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      className="p-1.5 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded transition-colors"
                      aria-label="Remove device"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GridView Component */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Live Feeds</h2>
            <div className="text-slate-400 text-sm">
              Click any feed to expand full screen
            </div>
          </div>
          
          <GridView devices={devices} maxFps={5} />
        </div>

        {/* Info Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-white">Responsive Grid</p>
                <p className="text-sm text-slate-400">
                  1 column on mobile, 2 on tablet, 3+ on desktop
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-white">Auto-Scaling</p>
                <p className="text-sm text-slate-400">
                  Layout adjusts based on number of devices
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-white">Click to Expand</p>
                <p className="text-sm text-slate-400">
                  Full-screen view with higher FPS
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <p className="font-semibold text-white">Status Indicators</p>
                <p className="text-sm text-slate-400">
                  Live status dots with room overlays
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper with WebSocket provider
const GridViewDemoWithProvider = () => {
  return (
    <WebSocketProvider url="ws://localhost:8000/ws">
      <GridViewDemo />
    </WebSocketProvider>
  );
};

export default GridViewDemoWithProvider;
