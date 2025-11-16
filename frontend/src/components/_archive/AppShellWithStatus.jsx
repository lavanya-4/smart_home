import { ShieldCheck } from 'lucide-react';
import { getIcon } from './icons';
import ConnectionStatus from './ConnectionStatus';

/**
 * Enhanced AppShell with WebSocket Connection Status
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.currentPage - Current page path
 * @param {Function} props.navigate - Navigation function
 * @param {boolean} props.isConnected - WebSocket connection status (optional)
 */
export default function AppShellWithStatus({ children, currentPage, navigate, isConnected = false }) {
  const navLinks = [
    ['Home', '/', 'Home'],
    ['Incidents', '/incidents', 'Incidents'],
    ['Devices', '/devices', 'Devices'],
    ['History', '/history', 'History'],
    ['Contacts', '/contacts', 'Contacts'],
    ['Policies', '/policies', 'Policies'],
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col w-full">
      {/* Top Header Bar with Connection Status */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-400 h-6 w-6" />
          <h1 className="text-lg font-semibold text-white">Smart Home Monitor</h1>
        </div>
        
        {/* Connection Status in top-right corner */}
        <ConnectionStatus isConnected={isConnected} />
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 w-full">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900/70 border-r border-slate-800 flex flex-col">
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
          
          {/* User Profile at Bottom */}
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

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
