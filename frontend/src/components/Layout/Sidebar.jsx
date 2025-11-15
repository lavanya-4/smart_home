import { AlertTriangle, HardDrive, History, Home, Settings, ShieldCheck, Users, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const navLinks = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { label: 'Devices', path: '/devices', icon: HardDrive },
  { label: 'History', path: '/history', icon: History },
  { label: 'Contacts', path: '/contacts', icon: Users },
  { label: 'Policies', path: '/policies', icon: Settings },
];

export default function Sidebar({ currentPage, user, onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'indigo',
      caregiver: 'emerald'
    };
    return colors[role] || 'indigo';
  };

  const roleColor = user ? getRoleColor(user.role) : 'indigo';

  return (
    <aside className="w-64 bg-slate-900/70 border-r border-slate-800 flex flex-col">
      <div className="text-2xl font-bold text-white p-4 flex items-center gap-2">
        <ShieldCheck className="text-indigo-400" />
        <span>CareApp</span>
      </div>
      
      <nav className="p-4 space-y-1 flex-1">
        {navLinks.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              currentPage === path
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-gray-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto p-4">
        {/* User Profile Card */}
        <div className="bg-slate-800 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${roleColor}-600 to-${roleColor}-400 flex items-center justify-center text-white font-bold text-lg`}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.roleTitle || 'Caregiver'}
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showLogoutConfirm ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Logout Dropdown */}
          {showLogoutConfirm && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Role Badge */}
        <div className={`text-center py-2 px-3 bg-${roleColor}-600/20 border border-${roleColor}-600/50 rounded-lg`}>
          <p className={`text-${roleColor}-400 text-xs font-semibold`}>
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </div>
    </aside>
  );
}
