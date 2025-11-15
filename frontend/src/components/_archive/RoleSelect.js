import { Users, Settings } from 'lucide-react';

export default function RolePicker({ onSelectRole }) {
  const roles = [
    { id: 'caregiver', icon: Users, title: 'Caregiver', subtitle: 'Monitor residents' },
    { id: 'admin', icon: Settings, title: 'Admin', subtitle: 'Manage system settings' },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Choose Your Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className="flex flex-col items-center justify-center p-8 bg-slate-700 rounded-2xl border-2 border-slate-600 hover:border-blue-500 hover:bg-slate-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <role.icon className="w-16 h-16 text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold text-white">{role.title}</h3>
              <p className="text-gray-400">{role.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
