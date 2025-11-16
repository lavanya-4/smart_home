import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, Grid3x3, List, Info, X } from 'lucide-react';
import { useNotifications, useDeviceNotifications } from '../context/NotificationContext';
import GridView from '../components/Video/GridView';
import DeviceCard from '../components/Device/DeviceCard';
import DeviceForm from '../components/Device/DeviceForm';
import api from '../services/api';

export default function DevicesPage({ user }) {
  const { showSuccess, showError } = useNotifications();
  const { notifyDeviceAdded, notifyDeviceDeleted } = useDeviceNotifications();
  const [viewMode, setViewMode] = useState('list');
  const [devices, setDevices] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDevices();
    fetchHouses();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await api.getDevices();

      const transformedDevices = data.map((device) => ({
        deviceId: device.device_id,
        room: device.name,
        location: device.location,
        status: device.status || 'offline',
        type: device.device_type || 'Camera',
        houseId: device.house_id,
        thingName: device.thing_name,
        certificates: device.certificates,
        certificateArn: device.certificate_arn,
      }));

      setDevices(transformedDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      showError('Failed to fetch devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHouses = async () => {
    try {
      const data = await api.getHouses();
      setHouses(data);
    } catch (error) {
      console.error('Error fetching houses:', error);
      showError('Failed to fetch houses');
      setHouses([]);
    }
  };

  const handleAddDevice = async (deviceData) => {
    try {
      const newDevice = await api.createDevice({
        house_id: deviceData.houseId,
        name: deviceData.room,
        device_type: deviceData.type.toLowerCase(),
        location: deviceData.location,
        description: deviceData.description || '',
      });

      const transformedDevice = {
        deviceId: newDevice.device_id,
        room: newDevice.name,
        location: newDevice.location,
        status: newDevice.status || 'offline',
        type: newDevice.device_type || 'Camera',
        houseId: newDevice.house_id,
        thingName: newDevice.thing_name,
        certificates: newDevice.certificates,
        certificateArn: newDevice.certificate_arn,
      };

      setDevices([...devices, transformedDevice]);
      notifyDeviceAdded(transformedDevice.deviceId, transformedDevice.room);
      showSuccess(`Device "${transformedDevice.room}" added successfully!`);
    } catch (error) {
      console.error('Error adding device:', error);
      showError(`Failed to add device: ${error.message}`);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    // Remove from local state immediately for responsive UI
    const device = devices.find((d) => d.deviceId === deviceId);
    setDevices(devices.filter((d) => d.deviceId !== deviceId));

    if (device) {
      notifyDeviceDeleted(device.deviceId, device.room);
    }
  };

  const handleProvisionSuccess = async (deviceId) => {
    // Fetch updated device data after provisioning
    try {
      const updatedDevice = await api.getDevice(deviceId);

      // Transform the updated device
      const transformedDevice = {
        deviceId: updatedDevice.device_id,
        room: updatedDevice.name,
        location: updatedDevice.location,
        status: updatedDevice.status || 'offline',
        type: updatedDevice.device_type || 'Camera',
        houseId: updatedDevice.house_id,
        thingName: updatedDevice.thing_name,
        certificates: updatedDevice.certificates,
        certificateArn: updatedDevice.certificate_arn,
      };

      // Update the device in the list
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.deviceId === deviceId ? transformedDevice : device
        )
      );
    } catch (error) {
      console.error('Error fetching updated device:', error);
      // Fallback: refresh all devices
      fetchDevices();
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Banner for Caregivers */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">👁️ View-Only Mode</h4>
              <p className="text-sm text-gray-300">
                You're logged in as a <strong className="text-blue-400">Caregiver</strong>. 
                You can view device information and live feeds, but cannot add, modify, or delete devices.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      {showInfoBanner && isAdmin && (
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">🚀 IoT Device Setup Guide</h4>
              <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                <li><strong className="text-white">Add Device</strong> - Fill the form and create a new device</li>
                <li><strong className="text-yellow-400">Provision Device</strong> - Click "Provision Device" to create AWS IoT certificates</li>
                <li><strong className="text-emerald-400">Download Certificates</strong> - Download the ZIP file with certificates</li>
                <li><strong className="text-indigo-400">Setup IoT Device</strong> - Extract ZIP to <code className="bg-slate-800 px-1 rounded">iot_device/certs/</code> folder</li>
                <li><strong className="text-purple-400">Run Device</strong> - Execute <code className="bg-slate-800 px-1 rounded">python device.py</code> on your IoT device</li>
              </ol>
              <p className="text-xs text-gray-400 mt-3">
                💡 Tip: The certificates are unique to each device and required for secure AWS IoT connection
              </p>
            </div>
            <button
              onClick={() => setShowInfoBanner(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Device Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchDevices}
            className="px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 bg-slate-700 text-gray-300 hover:bg-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
            Grid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Only show DeviceForm for admins */}
        {isAdmin && <DeviceForm onAddDevice={handleAddDevice} houses={houses} user={user} />}

        <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="ml-3 text-gray-400">Loading devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <HardDrive className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Devices Found</h3>
              <p className="text-gray-400">Add your first device to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <GridView devices={devices} maxFps={20} />
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                Active Devices ({devices.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {devices.map((device) => (
                  <DeviceCard 
                    key={device.deviceId} 
                    device={device}
                    user={user}
                    onDelete={handleDeleteDevice}
                    onProvisionSuccess={handleProvisionSuccess}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
