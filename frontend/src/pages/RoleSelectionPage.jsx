import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, Home } from 'lucide-react';

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'admin',
      title: 'House Admin',
      description: 'Manage and configure smart home system',
      icon: ShieldCheck,
      color: 'from-indigo-600 to-purple-600',
      hoverColor: 'hover:from-indigo-700 hover:to-purple-700'
    },
    {
      id: 'caregiver',
      title: 'Caregiver',
      description: 'Monitor and manage care for patients',
      icon: Users,
      color: 'from-emerald-600 to-teal-600',
      hoverColor: 'hover:from-emerald-700 hover:to-teal-700'
    }
  ];

  const handleRoleSelect = (roleId) => {
    navigate('/login', { state: { role: roleId } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheck className="h-12 w-12 text-indigo-400" />
            <h1 className="text-5xl font-bold text-white">CareApp</h1>
          </div>
          <p className="text-xl text-gray-300">Smart Home Care System</p>
          <p className="text-gray-400 mt-2">Select your role to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`group relative bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:border-slate-600 hover:shadow-2xl`}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {role.title}
                  </h3>
                  
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {role.description}
                  </p>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Continue</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Secure, reliable, and always there for you
          </p>
        </div>
      </div>
    </div>
  );
}
