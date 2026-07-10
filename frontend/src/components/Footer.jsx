import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 py-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
      <div>
        © {currentYear} Smart Hospital Energy Management System (SHEMS)
      </div>
      
      <div className="flex flex-wrap gap-4 items-center justify-end">
        <span className="px-2 py-1 bg-slate-900 border border-slate-800/60 rounded-md">BEMS 4.2</span>
        <span className="px-2 py-1 bg-slate-900 border border-slate-800/60 rounded-md text-cyan-500">IEEE 802.15.4 IoT</span>
        <span className="px-2 py-1 bg-slate-900 border border-slate-800/60 rounded-md text-emerald-500">ISO 50001 Certified</span>
      </div>
    </footer>
  );
}
