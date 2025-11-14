import React from 'react';
import { QrCode } from 'lucide-react';


export default function DeviceAdminPage() {
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
