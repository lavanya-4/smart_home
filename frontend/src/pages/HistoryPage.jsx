import React from 'react';

const dummyHistory = [
  { id: 1, event: 'Device added', details: 'Camera added to living room', timestamp: '2025-11-14 15:00:00' },
  { id: 2, event: 'Device removed', details: 'Microphone removed from kitchen', timestamp: '2025-11-14 14:00:00' },
  { id: 3, event: 'Alert acknowledged', details: 'Fire alert acknowledged by user', timestamp: '2025-11-14 13:30:00' },
];

export default function HistoryPage() {
  return (
    <div className="p-6 bg-slate-800 text-white rounded-lg">
      <h1 className="text-3xl font-extrabold mb-4 text-blue-400">History</h1>
      <ul className="space-y-4">
        {dummyHistory.map((entry) => (
          <li key={entry.id} className="p-4 bg-slate-700 rounded-lg border-l-4 border-purple-500">
            <h2 className="text-xl font-semibold text-purple-300">{entry.event}</h2>
            <p className="text-gray-300">{entry.details}</p>
            <span className="text-sm text-gray-500">{entry.timestamp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}