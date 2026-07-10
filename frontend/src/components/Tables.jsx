import React from 'react';

export default function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`overflow-x-auto w-full border border-slate-800 bg-slate-900/40 backdrop-blur-md rounded-2xl ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-950/60 border-b border-slate-800">
          <tr>
            {headers.map((h, i) => (
              <th 
                key={i} 
                className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
          {children}
        </tbody>
      </table>
    </div>
  );
}
