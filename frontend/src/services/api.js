/**
 * API Service - Centralized API calls
 */
import { getApiUrl, getAuthHeaders } from '../config';

class ApiService {
  // Generic fetch wrapper
  async fetch(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    const config = {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    return this.fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: email,
        password: password
      })
    });
  }

  async register(userData) {
    return this.fetch('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Houses
  async getHouses() {
    return this.fetch('/houses');
  }

  async getHouse(houseId) {
    return this.fetch(`/houses/${houseId}`);
  }

  async createHouse(houseData) {
    return this.fetch('/houses/add', {
      method: 'POST',
      body: JSON.stringify(houseData)
    });
  }

  async updateHouse(houseId, houseData) {
    return this.fetch(`/houses/${houseId}`, {
      method: 'PUT',
      body: JSON.stringify(houseData)
    });
  }

  async deleteHouse(houseId) {
    return this.fetch(`/houses/${houseId}`, {
      method: 'DELETE'
    });
  }

  // Devices
  async getDevices(houseId = null) {
    const query = houseId ? `?house_id=${houseId}` : '';
    return this.fetch(`/devices${query}`);
  }

  async getDevice(deviceId) {
    return this.fetch(`/devices/${deviceId}`);
  }

  async getDevicesByHouse(houseId) {
    return this.fetch(`/devices/house/${houseId}`);
  }

  async createDevice(deviceData) {
    return this.fetch('/devices/add', {
      method: 'POST',
      body: JSON.stringify(deviceData)
    });
  }

  async updateDevice(deviceId, deviceData) {
    return this.fetch(`/devices/${deviceId}/config`, {
      method: 'PUT',
      body: JSON.stringify(deviceData)
    });
  }

  async deleteDevice(deviceId) {
    return this.fetch(`/devices/${deviceId}`, {
      method: 'DELETE'
    });
  }

  async getDeviceStatus(deviceId) {
    return this.fetch(`/devices/${deviceId}/status`);
  }

  async controlDevice(deviceId, action, parameters = {}) {
    return this.fetch(`/devices/${deviceId}/control`, {
      method: 'POST',
      body: JSON.stringify({ action, parameters })
    });
  }

  // Device Provisioning
  async provisionDevice(deviceId) {
    return this.fetch(`/devices/${deviceId}/provision`, {
      method: 'POST'
    });
  }

  async downloadCertificates(deviceId) {
    const url = getApiUrl(`/devices/${deviceId}/download-certificates`);
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to download certificates');
    }

    // Return the blob for download
    const blob = await response.blob();
    const filename = `device_${deviceId}_certificates.zip`;
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, filename };
  }

  // Alerts
  async getAlerts(houseId = null, isRead = null) {
    const params = new URLSearchParams();
    if (houseId) params.append('house_id', houseId);
    if (isRead !== null) params.append('is_read', isRead);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetch(`/alerts${query}`);
  }

  async getAlert(alertId) {
    return this.fetch(`/alerts/${alertId}`);
  }

  async markAlertRead(alertId) {
    return this.fetch(`/alerts/${alertId}/read`, {
      method: 'PATCH'
    });
  }

  async deleteAlert(alertId) {
    return this.fetch(`/alerts/${alertId}`, {
      method: 'DELETE'
    });
  }

  // Users
  async getUsers() {
    return this.fetch('/users');
  }

  async getUser(userId) {
    return this.fetch(`/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return this.fetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId) {
    return this.fetch(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;
