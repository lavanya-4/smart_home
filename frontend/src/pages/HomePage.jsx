import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const API_URL = 'http://localhost:8000/api/v1';

export default function HomePage() {
  const navigate = useNavigate();
  const { showError } = useNotifications();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/houses`);
      if (!response.ok) throw new Error('Failed to fetch houses');
      const data = await response.json();
      setHouses(data);
    } catch (error) {
      console.error('Error fetching houses:', error);
      showError('Failed to fetch houses');
      setHouses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Houses Overview</h3>
          <button
            onClick={fetchHouses}
            className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="ml-3 text-gray-400">Loading houses...</span>
          </div>
        ) : houses.length === 0 ? (
          <div className="text-center py-8">
            <Home className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No houses found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map((house) => (
              <div
                key={house.house_id}
                onClick={() => navigate('/devices')}
                className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all cursor-pointer group relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{house.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{house.address}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      house.status === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-600 text-white'
                    }`}
                  >
                    {house.status}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-600 flex justify-between text-sm">
                  <span className="text-gray-400">Devices:</span>
                  <span className="text-white font-medium">
                    {house.active_devices || 0} / {house.total_devices || 0} active
                  </span>
                </div>
                
                {/* View Devices Button */}
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="flex items-center justify-between text-sm text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    <span className="font-semibold">View Devices</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
