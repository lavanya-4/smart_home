import React, { useState } from 'react';
import { Play, Rss, Key, Download, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import { useNotifications } from '../../context/NotificationContext';
import LiveFeed from '../Video/LiveFeed';
import LiveAudio from '../Audio/LiveAudio';
import api from '../../services/api';

export default function DeviceCard({ device, onDelete, onProvisionSuccess, user }) {
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { latestFrames } = useWebSocketContext();
  const { showSuccess, showError } = useNotifications();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const frameData = latestFrames.get(device.deviceId);
  const status = frameData?.status || device.status || 'unknown';
  const isOnline = status === 'online';
  
  // Check if device is already provisioned (has certificates/thing_name from backend)
  const isProvisioned = !!(device.thingName || device.certificates);

  const handleProvision = async () => {
    try {
      setIsProvisioning(true);
      const result = await api.provisionDevice(device.deviceId);
      showSuccess(`Device provisioned successfully! Thing: ${result.thing_name}`);
      // Call callback to refresh device data instead of reloading page
      if (onProvisionSuccess) {
        await onProvisionSuccess(device.deviceId);
      }
    } catch (error) {
      console.error('Error provisioning device:', error);
      showError(`Failed to provision device: ${error.message}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDownloadCertificates = async () => {
    try {
      setIsDownloading(true);
      const result = await api.downloadCertificates(device.deviceId);
      showSuccess(`Certificates downloaded: ${result.filename}`);
    } catch (error) {
      console.error('Error downloading certificates:', error);
      showError(`Failed to download certificates: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.deleteDevice(device.deviceId);
      showSuccess(`Device "${device.room}" deleted successfully!`);
      if (onDelete) {
        onDelete(device.deviceId);
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      showError(`Failed to delete device: ${error.message}`);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-900/50 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">
            {device.room || device.deviceId}
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isOnline ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              {status}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 font-mono">{device.deviceId}</p>
        {device.location && <p className="text-sm text-gray-400 mt-1">{device.location}</p>}
      </div>

      <div className="p-4">
        <div className="space-y-2">
          <button
            onClick={() => setShowLiveFeed(!showLiveFeed)}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {showLiveFeed ? <Play className="h-4 w-4" /> : <Rss className="h-4 w-4" />}
            {showLiveFeed ? 'Hide Live Feed' : 'Show Live Feed'}
          </button>

          {/* Provision Button - only show for admins and if not provisioned */}
          {isAdmin && !isProvisioned && (
            <button
              onClick={handleProvision}
              disabled={isProvisioning}
              className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isProvisioning
                  ? 'bg-slate-600 text-gray-300 cursor-wait'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {isProvisioning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Provision Device
                </>
              )}
            </button>
          )}

          {/* Download Certificates Button - show for admins if provisioned */}
          {isAdmin && isProvisioned && (
            <button
              onClick={handleDownloadCertificates}
              disabled={isDownloading}
              className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isDownloading
                  ? 'bg-slate-600 text-gray-300 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Certificates
                </>
              )}
            </button>
          )}
        </div>

        {showLiveFeed && (
          <div className="mt-4">
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
                maxFps={5}
                showMetrics={true}
                sendMetrics={false}
              />
            )}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Type:</span>
            <span className="text-white font-medium">{device.type || 'Camera'}</span>
          </div>
          {frameData?.metadata?.resolution && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Resolution:</span>
              <span className="text-white font-medium">{frameData.metadata.resolution}</span>
            </div>
          )}
          {frameData?.last_seen && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Last Seen:</span>
              <span className="text-white font-medium">
                {new Date(frameData.last_seen).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Delete Button - Admin Only */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-slate-700">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 border border-red-600/50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Device
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-yellow-400 text-center font-medium">
                ⚠️ This will permanently delete the device and all its data!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
