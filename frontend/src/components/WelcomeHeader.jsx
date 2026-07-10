import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, CloudLightning, Activity } from 'lucide-react';

export default function WelcomeHeader() {
  const { user, systemOnline } = useApp();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
      {/* Decorative gradient glowing balls */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl"></div>
      <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl"></div>

      <div className="relative z-10 space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 font-sans tracking-tight">
          {getGreeting()}, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{user?.name || 'Operator'}</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Hospital building management systems (BEMS) are operating normally. Real-time cooling systems and medical grids are stable.
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-4 items-center">
        <div className="px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 backdrop-blur-md">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">SYSTEM SECURITY</span>
            <span className="text-xs font-bold text-slate-200 uppercase">HIPAA COMPLIANT</span>
          </div>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 backdrop-blur-md">
          <div className={`p-2 rounded-xl ${systemOnline ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'}`}>
            <Activity size={20} className={systemOnline ? 'animate-pulse' : ''} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">GATEWAY NODE</span>
            <span className={`text-xs font-bold uppercase ${systemOnline ? 'text-cyan-400' : 'text-rose-400'}`}>
              {systemOnline ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
