import React, { useState } from 'react';
import { AlertTriangle, BellRing, RefreshCw, Power, Rss, ChevronRight, FileText, Settings } from 'lucide-react';

const demoIncidents = [
  { severity: 'critical', title: 'FALL DETECTED', meta: 'Apt 4 • 36s ago' },
  { severity: 'service', title: 'Service alert', meta: 'Apt 7 • 36m' },
  { severity: 'content', title: 'Content Detected', meta: 'Apr 12 • Nursery' },
];

export default function HomeDashboard() {
  const [selectedIncident, setSelectedIncident] = useState(demoIncidents[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <LiveRecentIncidentsCard incidents={demoIncidents} selectedIncident={selectedIncident} onIncidentClick={setSelectedIncident} />
        <DeviceHealthSummaryCard />
      </div>
      {/* Add more widgets or incident details on right if desired */}
    </div>
  );
}

function LiveRecentIncidentsCard({ incidents, selectedIncident, onIncidentClick }) {
  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Live & Recent Incidents</h3>
        <span className="text-sm text-gray-400">Low Incidents (5)</span>
      </div>
      <div className="flex justify-between items-center mb-4 p-3 bg-green-700/20 text-green-300 rounded-lg">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5" />
          <span className="font-medium">Ongoing Alerts (All Good)</span>
        </div>
        <span className="text-xs">APR 20S COUNTS</span>
      </div>
      <div className="flex flex-col gap-3">
        {incidents.map((incident, idx) => {
          const isSelected = incident.title === selectedIncident?.title;
          return (
            <IncidentChip
              key={idx}
              {...incident}
              isSelected={isSelected}
              onClick={() => onIncidentClick(incident)}
            />
          );
        })}
      </div>
      <button className="w-full mt-4 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 font-semibold transition-all flex justify-between items-center">
        <span>Recent Alerts</span>
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
}

function IncidentChip({ severity, title, meta, isSelected, onClick }) {
  const styles = {
    critical: 'bg-red-600 hover:bg-red-500 border-red-500',
    service: 'bg-slate-700 hover:bg-slate-600 border-slate-600',
    content: 'bg-slate-700 hover:bg-slate-600 border-slate-600',
  };

  const icons = {
    critical: <AlertTriangle className="w-5 h-5" />, 
    service: <Settings className="w-5 h-5 text-yellow-400" />, 
    content: <FileText className="w-5 h-5 text-blue-400" />
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg text-white font-medium flex items-center gap-3 transition-all ${styles[severity]} ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
    >
      {icons[severity]}
      <div className="flex-1 text-left">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-200 font-normal">{meta}</div>
      </div>
      <ChevronRight className="w-5 h-5" />
    </button>
  );
}

function DeviceHealthSummaryCard() {
  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mt-6">
      <h3 className="text-xl font-semibold text-white mb-4">Device Health</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status</span>
          <span className="font-semibold text-green-400 flex items-center gap-2"><Power className="w-5 h-5" /> 85%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Signal Strength (RSSI)</span>
          <span className="font-semibold text-green-400 flex items-center gap-2"><Rss className="w-5 h-5" /> Good</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Firmware</span>
          <span className="font-semibold text-gray-200">v2.2.3</span>
        </div>
      </div>
    </div>
  );
}
