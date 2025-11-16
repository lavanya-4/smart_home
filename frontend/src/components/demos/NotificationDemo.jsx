import React, { useState } from 'react';
import { NotificationProvider, useNotifications, useDeviceNotifications } from '../context/NotificationContext';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Trash2, Plus } from 'lucide-react';

/**
 * Demo component inner content (uses notification context)
 */
const NotificationDemoInner = () => {
  const { 
    showNotification, 
    showInfo, 
    showSuccess, 
    showWarning, 
    showError, 
    clearAll 
  } = useNotifications();
  
  const deviceNotifications = useDeviceNotifications();
  
  const [customMessage, setCustomMessage] = useState('');
  const [customType, setCustomType] = useState('info');
  const [customDuration, setCustomDuration] = useState(4000);

  // Sample device for testing
  const sampleDevices = [
    { id: 'camera-001', name: 'Living Room Camera' },
    { id: 'camera-002', name: 'Front Door Camera' },
    { id: 'sensor-001', name: 'Motion Sensor' },
    { id: 'thermostat-001', name: 'Smart Thermostat' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Bell className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">
              Notification System Demo
            </h1>
          </div>
          <p className="text-slate-600">
            Snackbar notifications with auto-dismiss and queuing
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => showInfo('This is an info notification')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Info className="h-5 w-5" />
              Info
            </button>
            
            <button
              onClick={() => showSuccess('Operation completed successfully!')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <CheckCircle className="h-5 w-5" />
              Success
            </button>
            
            <button
              onClick={() => showWarning('Please check your settings')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
            >
              <AlertTriangle className="h-5 w-5" />
              Warning
            </button>
            
            <button
              onClick={() => showError('An error occurred. Please try again.')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              <XCircle className="h-5 w-5" />
              Error
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Device Event Notifications */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Device Events</h2>
          
          <div className="space-y-3">
            {sampleDevices.map((device) => (
              <div 
                key={device.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{device.name}</h3>
                  <p className="text-sm text-slate-600 font-mono">{device.id}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => deviceNotifications.notifyDeviceConnected(device.id, device.name)}
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm font-semibold"
                  >
                    Connected
                  </button>
                  <button
                    onClick={() => deviceNotifications.notifyDeviceDisconnected(device.id, device.name)}
                    className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors text-sm font-semibold"
                  >
                    Disconnected
                  </button>
                  <button
                    onClick={() => deviceNotifications.notifyDeviceAdded(device.id, device.name)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Added
                  </button>
                  <button
                    onClick={() => deviceNotifications.notifyDeviceDeleted(device.id, device.name)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-semibold"
                  >
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Deleted
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Notification */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Custom Notification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Message
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter notification message..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Type
                </label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duration (ms)
                </label>
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                  min="1000"
                  max="10000"
                  step="1000"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (customMessage.trim()) {
                  showNotification(customMessage, customType, customDuration);
                  setCustomMessage('');
                }
              }}
              disabled={!customMessage.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              Show Custom Notification
            </button>
          </div>
        </div>

        {/* Test Queue Behavior */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Test Queue Behavior</h2>
          
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Maximum 3 notifications visible at once. Older notifications are removed when limit is exceeded.
            </p>
            
            <button
              onClick={() => {
                showInfo('Notification 1');
                setTimeout(() => showSuccess('Notification 2'), 200);
                setTimeout(() => showWarning('Notification 3'), 400);
                setTimeout(() => showError('Notification 4 (oldest removed)'), 600);
                setTimeout(() => showInfo('Notification 5 (oldest removed)'), 800);
              }}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Send 5 Rapid Notifications
            </button>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Auto-Dismiss</h3>
                  <p className="text-sm text-slate-600">
                    Notifications automatically dismiss after 4 seconds (configurable)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Manual Dismiss</h3>
                  <p className="text-sm text-slate-600">
                    Click X button to manually close any notification
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Progress Bar</h3>
                  <p className="text-sm text-slate-600">
                    Visual progress bar shows remaining time before auto-dismiss
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Queue Management</h3>
                  <p className="text-sm text-slate-600">
                    Max 3 notifications visible. Oldest removed when limit exceeded
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Color-Coded Types</h3>
                  <p className="text-sm text-slate-600">
                    Info (blue), Success (green), Warning (yellow), Error (red)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Device Events</h3>
                  <p className="text-sm text-slate-600">
                    Pre-built helpers for device connected/disconnected/added/deleted
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Usage Example</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">1. Wrap app with NotificationProvider</h3>
              <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto">
{`import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider maxVisible={3} defaultDuration={4000}>
      <YourApp />
    </NotificationProvider>
  );
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">2. Use notifications in components</h3>
              <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto">
{`import { useNotifications } from './context/NotificationContext';

function MyComponent() {
  const { showSuccess, showError } = useNotifications();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data');
    }
  };
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">3. Device event notifications</h3>
              <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto">
{`import { useDeviceNotifications } from './context/NotificationContext';

function DeviceManager() {
  const { notifyDeviceConnected, notifyDeviceAdded } = useDeviceNotifications();
  
  // On device connection
  notifyDeviceConnected('camera-001', 'Living Room Camera');
  
  // On new device added
  notifyDeviceAdded('sensor-002', 'Motion Sensor');
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Demo wrapper with NotificationProvider
 */
const NotificationDemo = () => {
  return (
    <NotificationProvider maxVisible={3} defaultDuration={4000}>
      <NotificationDemoInner />
    </NotificationProvider>
  );
};

export default NotificationDemo;
