import React, { useState, useEffect } from 'react';

export default function DeviceForm({ onAddDevice, houses, user }) {
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('');
  const [deviceType, setDeviceType] = useState('camera');
  const [selectedHouseId, setSelectedHouseId] = useState('');
  const [description, setDescription] = useState('');

  // Auto-select user's house if they only have one
  useEffect(() => {
    if (user?.house_ids && user.house_ids.length === 1) {
      setSelectedHouseId(user.house_ids[0]);
    } else if (houses && houses.length === 1) {
      setSelectedHouseId(houses[0].house_id);
    }
  }, [user, houses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deviceName && location && selectedHouseId) {
      onAddDevice({
        room: deviceName,
        location: location,
        type: deviceType.charAt(0).toUpperCase() + deviceType.slice(1),
        houseId: selectedHouseId,
        description: description,
      });
      setDeviceName('');
      setLocation('');
      setDeviceType('camera');
      setSelectedHouseId('');
      setDescription('');
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg p-6 h-fit sticky top-6">
      <h3 className="text-xl font-semibold text-white mb-4">Add Device</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Only show house selector if user has multiple houses */}
        {(!user?.house_ids || user.house_ids.length > 1) && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">House *</label>
            <select
              value={selectedHouseId}
              onChange={(e) => setSelectedHouseId(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a house...</option>
              {houses && houses.length > 0 ? (
                houses.map((house) => (
                  <option key={house.house_id} value={house.house_id}>
                    {house.name} - {house.address}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No houses available
                </option>
              )}
            </select>
            {houses && houses.length === 0 && (
              <p className="text-sm text-yellow-400 mt-1">No houses found. Add a house first.</p>
            )}
          </div>
        )}

        {/* Show house info if auto-selected */}
        {user?.house_ids && user.house_ids.length === 1 && houses && houses.length > 0 && (
          <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <label className="block text-sm font-medium text-gray-300 mb-1">House</label>
            <p className="text-white font-medium">
              {houses.find(h => h.house_id === selectedHouseId)?.name || 'Loading...'}
            </p>
            <p className="text-sm text-gray-400">
              {houses.find(h => h.house_id === selectedHouseId)?.address || ''}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Device Name *</label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g., Living Room Camera"
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Living Room"
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Device Type *</label>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="camera">Camera</option>
            <option value="microphone">Microphone</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            💡 Each device type connects separately with its own certificates
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows="2"
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={!deviceName || !location || !selectedHouseId}
        >
          Add Device
        </button>
      </form>
    </div>
  );
}
