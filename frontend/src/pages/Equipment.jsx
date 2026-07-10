import React from 'react';
import { useApp } from '../context/AppContext';
import { round } from '../utils/helpers';
import Table from '../components/Tables';
import { Monitor, ShieldCheck, Play, Power, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Equipment() {
  const { equipment, changeEquipmentState, user } = useApp();

  const isOperator = user && ['Admin', 'Energy Manager', 'Technician'].includes(user.role);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-sans">
          Medical Equipment health
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Monitor idle-times, diagnostics, health metrics, and grid draws of heavy radiology systems
        </p>
      </div>

      {/* Equipment table grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Scanners & Ventilators Status</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time load drawings and power factors</p>
        </div>

        <Table headers={['System name', 'Department', 'Grid load', 'Power Factor', 'System Health', 'Idle Time', 'State controls']}>
          {equipment.map((eq) => {
            const isIdleSpike = eq.status === 'Idle' && eq.idleTime > 120;
            const healthColor = eq.health > 95 ? 'text-emerald-400' : (eq.health > 90 ? 'text-amber-400' : 'text-rose-400');

            return (
              <tr key={eq.id} className="hover:bg-slate-800/10 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-200 flex items-center gap-3">
                  <Monitor size={16} className="text-slate-400" />
                  <span>{eq.name}</span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-400">{eq.dept}</td>
                <td className="px-6 py-4 font-extrabold text-cyan-400">{round(eq.load, 2)} kW</td>
                <td className="px-6 py-4 font-bold text-slate-300">{round(eq.powerFactor, 2)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      eq.health > 95 ? 'bg-emerald-500' : (eq.health > 90 ? 'bg-amber-500' : 'bg-rose-500')
                    }`}></span>
                    <strong className={healthColor}>{eq.health}%</strong>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${isIdleSpike ? 'text-rose-400' : 'text-slate-400'}`}>
                    {eq.idleTime} mins
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {/* Active */}
                    <button
                      disabled={!isOperator || eq.status === 'Active'}
                      onClick={() => changeEquipmentState(eq.id, 'Active')}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        eq.status === 'Active'
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title="Activate grid"
                    >
                      <Play size={12} />
                    </button>

                    {/* Standby/Idle */}
                    <button
                      disabled={!isOperator || eq.status === 'Idle'}
                      onClick={() => changeEquipmentState(eq.id, 'Idle')}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        eq.status === 'Idle'
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title="Idle/Standby"
                    >
                      <AlertTriangle size={12} />
                    </button>

                    {/* Shutoff */}
                    <button
                      disabled={!isOperator || eq.status === 'Off'}
                      onClick={() => changeEquipmentState(eq.id, 'Off')}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        eq.status === 'Off'
                          ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title="Shut off grid"
                    >
                      <Power size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>

      {/* Advisory Warnings */}
      {equipment.some(e => e.status === 'Idle' && e.idleTime > 120) && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-xs text-rose-400 font-semibold leading-relaxed">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p><strong>ALERT: Idle Equipment Spikes Detected</strong></p>
            <p className="mt-0.5 opacity-80">GE CT Scanner has been in idle state for over 2 hours, pulling baseload current. Shifting to Standby/Shutoff is recommended to save up to 12.4 kW.</p>
          </div>
        </div>
      )}
    </div>
  );
}
