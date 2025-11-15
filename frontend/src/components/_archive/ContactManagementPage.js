import React from 'react';
import { MessageSquare, Phone, Clock } from 'lucide-react';


export default function ContactManagementPage() {
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
       <label className="block text-sm font-medium text-gray-30D0 mb-2">
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
