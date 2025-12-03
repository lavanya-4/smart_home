import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { getApiUrl, getAuthHeaders } from '../config';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { latestFrames, subscribe, unsubscribe } = useWebSocketContext();
  const [devices, setDevices] = useState([]);

  // Fetch devices and subscribe to them
  useEffect(() => {
    const fetchDevicesAndSubscribe = async () => {
      try {
        const response = await fetch(getApiUrl('/devices'), {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const devicesData = await response.json();
          setDevices(devicesData);

          // Subscribe to all devices to get real-time alerts
          devicesData.forEach(device => {
            subscribe(device.device_id);
          });
        }
      } catch (err) {
        console.error('Error fetching devices for subscription:', err);
      }
    };

    fetchDevicesAndSubscribe();

    // Cleanup subscriptions on unmount
    return () => {
      devices.forEach(device => {
        unsubscribe(device.device_id);
      });
    };
  }, [subscribe, unsubscribe]);

  // Fetch historical incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        // Try the new incidents endpoint first, fallback to alerts/history
        let response = await fetch(getApiUrl('/incidents'), {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          // Fallback to alerts endpoint
          response = await fetch(getApiUrl('/alerts/history'), {
            headers: getAuthHeaders()
          });
        }

        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }

        const data = await response.json();
        setIncidents(data);
        console.log('Loaded incidents:', data.length, 'items');
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  // Listen for real-time incidents from WebSocket
  useEffect(() => {
    latestFrames.forEach((data, deviceId) => {
      if (data.alert) {
        setIncidents(prev => {
          // Avoid duplicates
          if (prev.some(i => i.alert_id === data.alert.alert_id)) {
            return prev;
          }
          // Add new alert to the top
          return [data.alert, ...prev];
        });
      }
    });
  }, [latestFrames]);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'border-red-500 text-red-300';
      case 'warning': return 'border-yellow-500 text-yellow-300';
      case 'info': return 'border-blue-500 text-blue-300';
      default: return 'border-gray-500 text-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'info': return <Info className="w-6 h-6 text-blue-400" />;
      default: return <CheckCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading incidents...</div>;
  }

  return (
    <div className="p-6 bg-slate-800 text-white rounded-lg min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">
          Incidents & Alerts
        </h1>
        <span className="bg-slate-700 px-3 py-1 rounded-full text-sm text-gray-300">
          {incidents.length} Total
        </span>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {incidents.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">No incidents reported</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {incidents.map((incident) => (
            <li
              key={incident.alert_id}
              className={`p-4 bg-slate-700/50 rounded-lg border-l-4 transition-all hover:bg-slate-700 ${getSeverityColor(incident.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getSeverityIcon(incident.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold capitalize">
                      {incident.severity} Alert
                    </h2>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(incident.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-200 mt-1 text-lg">{incident.message}</p>
                  <div className="mt-2 flex gap-4 text-sm text-gray-500">
                    <span>Device: {incident.device_id || 'Unknown'}</span>
                    <span>House: {incident.house_id || 'Unknown'}</span>
                    {incident.metadata && incident.metadata.location && (
                      <span>Location: {incident.metadata.location}</span>
                    )}
                    {incident.metadata && incident.metadata.confidence && (
                      <span>Confidence: {(incident.metadata.confidence * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}