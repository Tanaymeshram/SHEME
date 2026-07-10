import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { round, formatNumber } from '../utils/helpers';
import Loader from '../components/Loader';
import { 
  Zap, 
  Activity, 
  ArrowUpRight, 
  Cpu, 
  CheckCircle,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

export default function EnergyMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const stats = await api.getEnergyMonitoring();
        setData(stats);
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTelemetry();
  }, []);

  if (loading) {
    return <Loader text="Acquiring electrical telemetry bus..." />;
  }

  const { dailyLoads, phaseDetails } = data || {
    dailyLoads: [],
    phaseDetails: {
      phaseA: { voltage: 230, current: 0, powerFactor: 0.95 },
      phaseB: { voltage: 230, current: 0, powerFactor: 0.95 },
      phaseC: { voltage: 230, current: 0, powerFactor: 0.95 }
    }
  };

  const phases = [
    { name: 'Phase A (Red)', data: phaseDetails.phaseA, color: 'border-l-rose-500' },
    { name: 'Phase B (Yellow)', data: phaseDetails.phaseB, color: 'border-l-yellow-500' },
    { name: 'Phase C (Blue)', data: phaseDetails.phaseC, color: 'border-l-cyan-500' }
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-sans">
          Energy Grid Telemetry
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Live electrical bus metrics, load profiles, and solar generation balancing
        </p>
      </div>

      {/* Grid Load vs Solar Offset Composed Graph */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Hourly Load balancing</h3>
          <p className="text-xs text-slate-500 mt-0.5">Composed grid draw vs solar offset (kW)</p>
        </div>

        <div className="h-72 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyLoads} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.08)' }} 
                itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }} />
              <Bar dataKey="baseload" name="Base Grid Draw" fill="#1e293b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="solar" name="Solar Offset" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="peakload" name="Peak Load" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phase Diagnostics Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">3-Phase Electrical Diagnostics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {phases.map((phase, index) => {
            const pf = phase.data.powerFactor;
            const isPfCritical = pf < 0.85;

            return (
              <div 
                key={index}
                className={`bg-slate-900/40 border border-slate-800 border-l-4 ${phase.color} rounded-3xl p-6 shadow-xl space-y-6 hover:border-slate-700/50 transition-all duration-300`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">{phase.name}</h4>
                  <span className="p-1 rounded-md bg-slate-950/40 text-slate-400">
                    <Cpu size={14} />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">VOLTAGE</span>
                    <span className="text-base font-extrabold text-slate-200 block">{round(phase.data.voltage, 1)} V</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CURRENT</span>
                    <span className="text-base font-extrabold text-slate-200 block">{round(phase.data.current, 1)} A</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">POWER FACTOR</span>
                    <span className={`text-base font-extrabold block ${isPfCritical ? 'text-rose-400' : 'text-slate-200'}`}>
                      {round(pf, 2)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">APPARENT POWER</span>
                    <span className="text-base font-extrabold text-slate-200 block">
                      {round((phase.data.voltage * phase.data.current) / 1000, 2)} kVA
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/40 flex items-center gap-2">
                  {isPfCritical ? (
                    <>
                      <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">LOW PF: CAPACITOR BANK OVERRIDE SUGGESTED</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">PHASE STABLE AND RUNNING STABLE</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
