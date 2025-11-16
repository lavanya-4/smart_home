import React from 'react';
import { BarChart, LineChart } from 'lucide-react';


export default function PoliciesAnalyticsPage() {
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
