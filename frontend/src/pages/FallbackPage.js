import React from 'react';


export default function FallbackPage({ page }) {
 return (
   <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
     <h3 className="text-xl font-semibold text-white">Page: {page}</h3>
     <p className="text-gray-400">This page is under construction.</p>
   </div>
 );
}
