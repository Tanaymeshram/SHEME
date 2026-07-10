import React from 'react';
import { useApp } from '../context/AppContext';
import { round, getStatusColorClass } from '../utils/helpers';
import { BellRing, CheckCircle, ShieldAlert } from 'lucide-react';

export default function AlertCards({ maxCount = null }) {
  const { alerts, acknowledgeAlert } = useApp();

  const displayedAlerts = maxCount ? alerts.slice(0, maxCount) : alerts;

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-slate-900/20 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-semibold">
        No active system alerts detected. Real-time telemetry is running clean.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedAlerts.map((alert) => {
        const severityClass = getStatusColorClass(alert.severity);
        
        return (
          <div 
            key={alert.id}
            className={`bg-slate-900/40 border ${alert.resolved ? 'border-slate-800/50 opacity-60' : 'border-slate-800 hover:border-slate-700/60'} rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300`}
          >
            <div className="flex gap-4 items-start">
              <div className={`p-3 rounded-2xl ${
                alert.resolved 
                  ? 'bg-slate-950/60 text-slate-500' 
                  : (alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20')
              }`}>
                {alert.resolved ? <CheckCircle size={22} /> : <ShieldAlert size={22} />}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className={`text-sm font-extrabold ${alert.resolved ? 'text-slate-400' : 'text-slate-200'}`}>
                    {alert.severity.toUpperCase()} ALERT • {alert.department}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold">{alert.timestamp}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{alert.message}</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Sensor: {alert.sensor}</span>
                  <span>•</span>
                  <span>Value: <strong className={alert.resolved ? 'text-slate-500' : 'text-cyan-400'}>{alert.value}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              {alert.resolved ? (
                <span className="px-3 py-1.5 bg-slate-950/60 border border-slate-800 text-[10px] font-extrabold text-slate-500 rounded-xl uppercase tracking-wider">
                  Resolved
                </span>
              ) : (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 hover:text-white rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 group"
                >
                  <CheckCircle size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
