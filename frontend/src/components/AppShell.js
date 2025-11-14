import { ShieldCheck } from 'lucide-react';
import { getIcon } from './icons';

export default function AppShell({ children, currentPage, navigate }) {
  const navLinks = [
    ['Home', '/', 'Home'],
    ['Incidents', '/incidents', 'Incidents'],
    ['Devices', '/devices', 'Devices'],
    ['History', '/history', 'History'],
    ['Contacts', '/contacts', 'Contacts'],
    ['Policies', '/policies', 'Policies'],
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex w-full">
      <aside className="w-64 bg-slate-900/70 border-r border-slate-800 flex flex-col">
        <div className="text-2xl font-bold text-white p-4 flex items-center gap-2">
          <ShieldCheck className="text-blue-400" />
          <span>CareApp</span>
        </div>
        <nav className="p-4 space-y-1">
          {navLinks.map(([label, href, iconKey]) => (
            <a
              key={href}
              href={href}
              onClick={e => { e.preventDefault(); navigate(href); }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all
                ${
                  currentPage === href
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              {getIcon(iconKey)}
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
            <img
              src="https://placehold.co/40x40/5865f2/white?text=M"
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-blue-400"
            />
            <div>
              <div className="font-semibold text-white">Mome</div>
              <div className="text-sm text-gray-400">Caregiver</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
