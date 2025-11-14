import React, { useState } from 'react';
import {
 Home,
 AlertTriangle,
 HardDrive,
 History,
 Users,
 Settings,
 User,
 ShieldCheck,
 Power,
 ChevronRight,
 QrCode,
 Rss,
 FileText,
 Clock,
 BarChart,
 LineChart,
 Phone,
 MessageSquare,
 Webhook,
 Play,
 RefreshCw,
 BellRing,
} from 'lucide-react';


// --- Icon Mapping ---
// Utility to map string names from JSON to actual icon components
const iconMap = {
 Home: Home,
 Incidents: AlertTriangle,
 Devices: HardDrive,
 History: History,
 Contacts: Users,
 Policies: Settings,
 users: User,
 gear: Settings,
 default: AlertTriangle,
};


const getIcon = (iconName) => {
 const IconComponent = iconMap[iconName] || iconMap.default;
 return <IconComponent className="w-5 h-5" />;
};


// --- AppShell Component ---
function AppShell({ children, currentPage, navigate }) {
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
         <ShieldCheck className="text-indigo-400" />
         <span>CareApp</span>
       </div>
       <nav className="p-4 space-y-1">
         {navLinks.map(([label, href, iconKey]) => (
           <a
             key={href}
             href={href}
             onClick={(e) => {
               e.preventDefault();
               navigate(href);
             }}
             className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all
               ${
                 currentPage === href
                   ? 'bg-indigo-600 text-white font-semibold'
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
             src="https://placehold.co/40x40/6366f1/white?text=M"
             alt="User"
             className="w-10 h-10 rounded-full border-2 border-indigo-400"
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


// --- AuthPage Component ---
function AuthPage({ onLogin }) {
 return (
   <div className="w-full h-full flex items-center justify-center">
     <LoginCard onLogin={onLogin} />
   </div>
 );
}


function LoginCard({ onLogin }) {
 return (
   <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-2xl p-8">
     <h2 className="text-3xl font-bold text-center text-white mb-2">
       Welcome Back
     </h2>
     <p className="text-center text-gray-400 mb-8">Good Morning, Mome (---)</p>


     <form
       onSubmit={(e) => {
         e.preventDefault();
         onLogin();
       }}
     >
       <div className="mb-4">
         <label
           className="block text-sm font-medium text-gray-300 mb-2"
           htmlFor="email"
         >
           Email
         </label>
         <input
           type="email"
           id="email"
           placeholder="you@example.com"
           defaultValue="mome@example.com"
           className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
         />
       </div>
       <div className="mb-6">
         <label
           className="block text-sm font-medium text-gray-300 mb-2"
           htmlFor="password"
         >
           Password
         </label>
         <input
           type="password"
           id="password"
           placeholder="••••••••"
           defaultValue="password"
           className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
         />
       </div>
       <button
         type="button"
         className="w-full flex justify-center items-center gap-2 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all mb-4"
       >
         <svg
           className="w-5 h-5"
           fill="currentColor"
           viewBox="0 0 24 24"
           aria-hidden="true"
         >
           <path
             d="M12.0003 4.75C13.7703 4.75 15.3553 5.42 16.5453 6.56L19.9653 3.18C17.7353 1.1 14.9953 0 12.0003 0C7.3103 0 3.2603 2.67 1.4303 6.39L4.8503 9.18C5.6903 6.62 8.5603 4.75 12.0003 4.75Z"
             fill="#EA4335"
           />
           <path
             d="M23.25 12C23.25 11.22 23.18 10.45 23.06 9.71L12 9.71L12 14.2H18.28C18.09 15.68 17.38 16.96 16.32 17.72L19.74 20.5C21.94 18.41 23.25 15.42 23.25 12Z"
             fill="#4285F4"
           />
           <path
             d="M5.6897 14.82C5.4397 14.1 5.3097 13.34 5.3097 12.56C5.3097 11.78 5.4397 11.02 5.6897 10.3L2.2697 7.51C1.0297 9.8 0.329699 12.56 0.329699 15.44C0.329699 18.32 1.0297 21.08 2.2697 23.37L5.6897 20.59C5.4397 19.88 5.3097 19.12 5.3097 18.34C5.3097 17.56 5.4397 16.8 5.6897 16.09L5.6897 14.82Z"
             fill="#FBBC05"
           />
           <path
             d="M12.0003 24C15.2403 24 17.9603 22.92 19.9603 21.09L16.5403 18.3C15.3903 19.17 13.8303 19.66 12.0003 19.66C8.5603 19.66 5.6903 17.78 4.8503 15.22L1.4303 18.01C3.2603 21.73 7.3103 24 12.0003 24Z"
             fill="#34A853"
           />
         </svg>
         Sign in with SSO
       </button>
       <button
         type="submit"
         className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all"
       >
         Login
       </button>
       <p className="text-center text-sm text-gray-400 mt-6">
         Don't have an account?
       </p>
     </form>
   </div>
 );
}


// --- RolePicker Component ---
function RolePicker({ onSelectRole }) {
 const roles = [
   {
     id: 'caregiver',
     icon: Users,
     title: 'Caregiver',
     subtitle: 'Monitor residents',
   },
   {
     id: 'admin',
     icon: Settings,
     title: 'Admin',
     subtitle: 'Manage system settings',
   },
 ];


 return (
   <div className="w-full h-full flex items-center justify-center">
     <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl p-8">
       <h2 className="text-3xl font-bold text-center text-white mb-8">
         Choose Your Role
       </h2>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {roles.map((role) => (
           <button
             key={role.id}
             onClick={() => onSelectRole(role.id)}
             className="flex flex-col items-center justify-center p-8 bg-slate-700 rounded-2xl border-2 border-slate-600 hover:border-indigo-500 hover:bg-slate-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
           >
             <role.icon className="w-16 h-16 text-indigo-400 mb-4" />
             <h3 className="text-2xl font-semibold text-white">
               {role.title}
             </h3>
             <p className="text-gray-400">{role.subtitle}</p>
           </button>
         ))}
       </div>
     </div>
   </div>
 );
}


// --- HomeDashboard Component ---
function HomeDashboard({ role, selectedIncident, setSelectedIncident }) {
 const incidents = [
   { severity: 'critical', title: 'FALL DETECTED', meta: 'Apt 4 • 36s ago' },
   { severity: 'service', title: 'Service alert', meta: 'Apt 7 • 36m' },
   { severity: 'content', title: 'Content Detected', meta: 'Apr 12 • Nursery' },
 ];


 // Set the default selected incident to the first critical one
 const [incidentToDetail, setIncidentToDetail] = useState(incidents[0]);


 return (
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
     <div className="lg:col-span-1 flex flex-col gap-6">
       <LiveRecentIncidentsCard
         incidents={incidents}
         onIncidentClick={setIncidentToDetail}
         selectedIncident={incidentToDetail}
       />
       <DeviceHealthSummaryCard />
     </div>
     <div className="lg:col-span-2">
       {incidentToDetail && <IncidentDetailCard incident={incidentToDetail} />}
     </div>
   </div>
 );
}


function LiveRecentIncidentsCard({
 incidents,
 onIncidentClick,
 selectedIncident,
}) {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <div className="flex justify-between items-center mb-4">
       <h3 className="text-xl font-semibold text-white">
         Live & Recent Incidents
       </h3>
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
       {incidents.map((incident, i) => (
         <IncidentChip
           key={i}
           {...incident}
           isSelected={incident.title === selectedIncident?.title}
           onClick={() => onIncidentClick(incident)}
         />
       ))}
     </div>
     <button className="w-full mt-4 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 font-semibold transition-all flex justify-between items-center">
       <span>Recent Alerts</span>
       <RefreshCw className="w-5 h-5" />
     </button>
   </div>
 );
}


function IncidentChip({ severity, title, meta, onClick, isSelected }) {
 const styles = {
   critical: 'bg-red-600 hover:bg-red-500 border-red-500',
   service: 'bg-slate-700 hover:bg-slate-600 border-slate-600',
   content: 'bg-slate-700 hover:bg-slate-600 border-slate-600',
 };
 const icon = {
   critical: <AlertTriangle className="w-5 h-5" />,
   service: <Settings className="w-5 h-5 text-yellow-400" />,
   content: <FileText className="w-5 h-5 text-blue-400" />,
 };


 return (
   <button
     onClick={onClick}
     className={`w-full p-4 rounded-lg text-white font-medium flex items-center gap-3 transition-all ${
       styles[severity]
     } ${isSelected ? 'ring-2 ring-indigo-400' : 'ring-0'}`}
   >
     {icon[severity]}
     <div className="flex-1 text-left">
       <div className="font-semibold">{title}</div>
       <div className="text-sm text-gray-200 font-normal">{meta}</div>
     </div>
     <ChevronRight className="w-5 h-5" />
   </button>
 );
}


function IncidentDetailCard({ incident }) {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6 h-full flex flex-col">
     <div
       className={`p-4 rounded-lg text-white font-semibold text-lg mb-4 ${
         incident.severity === 'critical' ? 'bg-red-600' : 'bg-blue-600'
       }`}
     >
       {incident.title} - {incident.meta}
     </div>


     {/* SignalGraph Placeholder */}
     <div className="w-full h-40 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
       <LineChart className="w-1/2 h-1/2 text-slate-500" />
       <span className="text-slate-500">Waveform visualization</span>
     </div>


     {/* Playback Controls Placeholder */}
     <div className="flex items-center gap-4 mb-6">
       <button className="text-gray-300 hover:text-white">
         <Play className="w-6 h-6" />
       </button>
       <div className="flex-1 h-1 bg-slate-600 rounded-full">
         <div className="w-1/4 h-full bg-indigo-500 rounded-full"></div>
       </div>
       <span className="text-sm text-gray-400">0:03 / 0:12</span>
     </div>


     <div className="flex-1 flex flex-col md:flex-row gap-6">
       {/* Device Info */}
       <div className="flex-1">
         <h4 className="text-lg font-semibold text-white mb-2">Device Info</h4>
         <p className="text-gray-400 mb-1">Cosin: Mccdmsnt</p>
         <p className="text-gray-400 mb-4">Cond: 48 Morm</p>
         <button className="p-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 font-semibold transition-all">
           Run OTA Test
         </button>
       </div>


       {/* Quick Actions */}
       <div className="w-full md:w-1/2">
         <h4 className="text-lg font-semibold text-white mb-3">
           Quick Actions
         </h4>
         <div className="flex flex-col gap-3">
           <button className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 font-semibold transition-all text-left flex justify-between items-center">
             <span>Call Patient</span>
             <span className="text-xs text-gray-400">10 Click</span>
           </button>
           <button className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 font-semibold transition-all text-left">
             Notify Contact
           </button>
           <button className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 font-semibold transition-all text-left">
             Notify Family
           </button>
           <button className="p-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-all text-left">
             Escalate
           </button>
         </div>
       </div>
     </div>
   </div>
 );
}


function DeviceHealthSummaryCard() {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white mb-4">Device Health</h3>
     <div className="space-y-3">
       <div className="flex justify-between items-center">
         <span className="text-gray-400">Status</span>
         <span className="font-semibold text-green-400 flex items-center gap-2">
           <Power className="w-5 h-5" /> 85%
         </span>
       </div>
       <div className="flex justify-between items-center">
         <span className="text-gray-400">Signal Strength (RSSI)</span>
         <span className="font-semibold text-green-400 flex items-center gap-2">
           <Rss className="w-5 h-5" /> Good
         </span>
       </div>
       <div className="flex justify-between items-center">
         <span className="text-gray-400">Firmware</span>
         <span className="font-semibold text-gray-200">v2.2.3</span>
       </div>
     </div>
     <div className="flex justify-between items-center mt-6 p-3 bg-slate-700 rounded-lg">
       <span className="font-medium text-white">Run Self Test</span>
       <label className="relative inline-flex items-center cursor-pointer">
         <input type="checkbox" value="" className="sr-only peer" />
         <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
       </label>
     </div>
   </div>
 );
}


// --- DeviceAdminPage Component ---
function DeviceAdminPage() {
 return (
   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     <DeviceOnboardingCard />
     {/* This is a guess, combining DeviceHealthCard from JSON with the summary card design */}
     <DeviceHealthAdminCard />
   </div>
 );
}


function DeviceOnboardingCard() {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white mb-4">
       Device Onboarding
     </h3>
     <div className="flex flex-col items-center p-8 bg-slate-700 rounded-lg mb-6">
       <QrCode className="w-24 h-24 text-gray-400 mb-4" />
       <button className="p-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all">
         Scan QR Code
       </button>
     </div>
     <div className="space-y-4">
       <div>
         <label className="block text-sm font-medium text-gray-300 mb-2">
           Assign to Room
         </label>
         <select className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
           <option>Select a room...</option>
           <option>Apt 4 - Living Room</option>
           <option>Apt 7 - Bedroom</option>
         </select>
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-300 mb-2">
           Device Name
         </label>
         <input
           type="text"
           placeholder="e.g., Living Room Sensor"
           className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
         />
       </div>
       <button className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all">
         Run OTA Test & Save
       </button>
     </div>
   </div>
 );
}


function DeviceHealthAdminCard() {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white mb-4">Device Health</h3>
     <div className="space-y-3 mb-6">
       <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
         <span className="font-medium text-white">Device Status</span>
         <span className="px-3 py-1 rounded-full bg-green-600 text-white text-sm font-semibold">
           Online
         </span>
       </div>
       <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
         <span className="font-medium text-white">Battery</span>
         <span className="font-semibold text-green-400">85%</span>
       </div>
       <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
         <span className="font-medium text-white">Firmware</span>
         <span className="px-3 py-1 rounded-full bg-slate-600 text-white text-sm font-semibold">
           v2.2.3
         </span>
       </div>
     </div>
     <button className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all">
       Run Self-Test on All Devices
     </button>
   </div>
 );
}


// --- PoliciesAnalyticsPage Component ---
function PoliciesAnalyticsPage() {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white mb-6">
       Policies & Analytics
     </h3>


     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
       {/* Policies */}
       <div className="space-y-6">
         <div>
           <label className="block font-medium text-gray-300 mb-2">
             Fall Detection Threshold
           </label>
           <div className="flex items-center gap-4">
             <span className="text-sm text-gray-400">Low</span>
             <input
               type="range"
               min="0"
               max="100"
               defaultValue="75"
               className="flex-1"
             />
             <span className="text-sm text-gray-400">High</span>
           </div>
         </div>


         <div className="p-4 bg-slate-700 rounded-lg">
           <div className="flex justify-between items-center mb-2">
             <h4 className="font-semibold text-white">Quiet Hours</h4>
             <label className="relative inline-flex items-center cursor-pointer">
               <input
                 type="checkbox"
                 defaultChecked
                 value=""
                 className="sr-only peer"
               />
               <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
             </label>
           </div>
           <p className="text-gray-400 mb-3">22:00 – 06:00</p>
           <button className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">
             Edit Schedule
           </button>
         </div>
       </div>


       {/* KPIs */}
       <div className="grid grid-cols-2 gap-4">
         <div className="p-4 bg-slate-700 rounded-lg">
           <h4 className="text-sm font-medium text-gray-400 mb-1">
             False Alarm Rate
           </h4>
           <p className="text-3xl font-semibold text-white">3.1%</p>
         </div>
         <div className="p-4 bg-slate-700 rounded-lg">
           <h4 className="text-sm font-medium text-gray-400 mb-1">
             Avg. Response Time
           </h4>
           <p className="text-3xl font-semibold text-white">1.2s</p>
         </div>
       </div>
     </div>


     {/* Charts */}
     <div>
       <h4 className="text-lg font-semibold text-white mb-4">Analytics</h4>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-4 bg-slate-700 rounded-lg h-64 flex flex-col items-center justify-center">
           <BarChart className="w-1/2 h-1/2 text-slate-500" />
           <p className="text-slate-500 mt-2">Alerts by Day (Bar Chart)</p>
         </div>
         <div className="p-4 bg-slate-700 rounded-lg h-64 flex flex-col items-center justify-center">
           <LineChart className="w-1/2 h-1/2 text-slate-500" />
           <p className="text-slate-500 mt-2">
             Avg. Response Time (Line Chart)
           </p>
         </div>
       </div>
     </div>
   </div>
 );
}


// --- ContactManagementPage Component ---
function ContactManagementPage() {
 return (
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     <ContactManagementCard />
     <EscalationPolicyCard />
   </div>
 );
}


function ContactManagementCard() {
 const contactGroups = [
   {
     title: 'Apartment 4 – Living Room',
     contacts: [
       { name: 'Jane Doe (Daughter)', channels: ['sms', 'call'] },
       { name: 'Dr. Smith (Clinic)', channels: ['sms', 'call'] },
       { name: 'John Lee (Neighbor)', channels: ['sms', 'call'] },
     ],
   },
 ];


 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white mb-4">
       Contact Management
     </h3>
     {contactGroups.map((group, i) => (
       <div key={i} className="mb-6">
         <h4 className="font-semibold text-indigo-300 mb-3">{group.title}</h4>
         <ul className="space-y-3">
           {group.contacts.map((contact, j) => (
             <li
               key={j}
               className="flex justify-between items-center p-3 bg-slate-700 rounded-lg"
             >
               <span className="font-medium text-white">{contact.name}</span>
               <div className="flex gap-2">
                 {contact.channels.includes('sms') && (
                   <MessageSquare className="w-5 h-5 text-gray-400" />
                 )}
                 {contact.channels.includes('call') && (
                   <Phone className="w-5 h-5 text-gray-400" />
                 )}
               </div>
             </li>
           ))}
         </ul>
       </div>
     ))}
     <button className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all">
       Add New Contact
     </button>
   </div>
 );
}


function EscalationPolicyCard() {
 const steps = [
   { action: 'Notify Primary (SMS/Call)', wait: '5 min' },
   { action: 'Notify Backup (SMS/Call)', wait: '5 min' },
   { action: 'Trigger Call-Center Webhook', editWebhookUrl: true },
 ];


 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white mb-4">
       Escalation Policy
     </h3>
     <div className="mb-6">
       <label className="block text-sm font-medium text-gray-300 mb-2">
         Condition
       </label>
       <p className="p-3 bg-slate-700 rounded-lg text-white font-medium">
         If alert is CRITICAL
       </p>
     </div>
     <div>
       <label className="block text-sm font-medium text-gray-300 mb-2">
         Steps
       </label>
       <ol className="relative border-l border-slate-600 space-y-6 ml-4">
         {steps.map((step, i) => (
           <li key={i} className="ml-8">
             <span className="absolute flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full -left-4 ring-4 ring-slate-800 text-white font-bold">
               {i + 1}
             </span>
             <h4 className="font-semibold text-white mb-1">{step.action}</h4>
             {step.wait && (
               <div className="text-sm text-gray-400 flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 <span>Wait {step.wait}</span>
               </div>
             )}
             {step.editWebhookUrl && (
               <button className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold mt-1">
                 Edit Webhook URL
               </button>
             )}
           </li>
         ))}
       </ol>
     </div>
     <button className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all mt-8">
       Save Changes
     </button>
   </div>
 );
}


// --- FallbackPage Component ---
function FallbackPage({ page }) {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white">Page: {page}</h3>
     <p className="text-gray-400">This page is under construction.</p>
   </div>
 );
}


// --- Main Application ---
export default function App() {
 const [page, setPage] = useState('/auth');
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [role, setRole] = useState(null); // 'caregiver' or 'admin'
 const [selectedIncident, setSelectedIncident] = useState(null);


 // Mock authentication
 const handleLogin = () => {
   setIsAuthenticated(true);
   setPage('/role-picker'); // Go to role picker after login
 };


 // Mock role selection
 const handleSelectRole = (selectedRole) => {
   setRole(selectedRole);
   setPage('/'); // Go to home dashboard after role selection
 };


 // Handle navigation
 const navigate = (route) => {
   if (isAuthenticated) {
     setPage(route);
   } else {
     setPage('/auth');
   }
 };


 // --- Main Content Router ---
 function MainContent() {
   // Simple router
   switch (page) {
     case '/':
       return (
         <HomeDashboard
           role={role}
           selectedIncident={selectedIncident}
           setSelectedIncident={setSelectedIncident}
         />
       );
     case '/devices':
       return <DeviceAdminPage />;
     case '/policies':
       return <PoliciesAnalyticsPage />;
     case '/contacts':
       return <ContactManagementPage />;
     // Add other routes as needed
     case '/incidents':
     case '/history':
     default:
       return <FallbackPage page={page} />;
   }
 }


 // Main content renderer based on auth status and role
 const renderContent = () => {
   if (!isAuthenticated) {
     return <AuthPage onLogin={handleLogin} />;
   }
   if (!role) {
     return <RolePicker onSelectRole={handleSelectRole} />;
   }
   // If authenticated and role is set, show the main AppShell
   return (
     <AppShell currentPage={page} navigate={navigate}>
       <MainContent />
     </AppShell>
   );
 };


 return (
   <div className="flex w-full h-screen bg-slate-900 text-gray-200 font-sans">
     {renderContent()}
   </div>
 );
}
