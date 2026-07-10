import React from 'react';
import RoomCards from '../components/RoomCards';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Info } from 'lucide-react';

export default function Rooms() {
  const { user } = useApp();

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-sans">
            Rooms & Wings Command
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Hospital micro-grid climate controls & occupancy
          </p>
        </div>

        <div className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <ShieldCheck size={14} className="text-cyan-400" />
          Role: <strong className="text-slate-200">{user?.role}</strong>
        </div>
      </div>

      {/* Operator Warning Banner */}
      {user?.role === 'Operator' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-xs text-amber-400 font-semibold leading-relaxed">
          <Info size={16} className="shrink-0 mt-0.5" />
          <div>
            <p>You have Read-Only view access for climate controls. Only Administrators, Energy Managers, or Technicians can adjust climate and HVAC override configurations.</p>
          </div>
        </div>
      )}

      {/* Room Roster Cards Grid */}
      <RoomCards />
    </div>
  );
}
