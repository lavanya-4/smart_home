import React from 'react';

const dummyPolicies = [
  { id: 1, name: 'Fall Detection', description: 'Alerts when a fall is detected.', status: 'Enabled' },
  { id: 2, name: 'Intrusion Detection', description: 'Notifies when an intrusion is detected.', status: 'Disabled' },
  { id: 3, name: 'Temperature Monitoring', description: 'Monitors and alerts on abnormal temperature changes.', status: 'Enabled' },
];

export default function PoliciesPage() {
  return (
    <div className="p-6 bg-slate-800 text-white rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Policies</h1>
      <ul className="space-y-4">
        {dummyPolicies.map((policy) => (
          <li key={policy.id} className="p-4 bg-slate-700 rounded-lg border-l-4 border-green-500">
            <h2 className="text-xl font-semibold text-green-300">{policy.name}</h2>
            <p className="text-gray-300">{policy.description}</p>
            <span className="text-sm text-gray-500">Status: {policy.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}