import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import AlertCards from '../components/AlertCards';
import Button from '../components/Buttons';
import { BellRing, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';

export default function Alerts() {
  const { alerts, injectMockSpike, user } = useApp();
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'resolved'

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  const getFilteredAlerts = () => {
    switch (filter) {
      case 'active':
        return activeAlerts;
      case 'resolved':
        return resolvedAlerts;
      case 'all':
      default:
        return alerts;
    }
  };

  const handleInjectSpike = () => {
    const depts = ['ICU Wing B', 'Operation Theatre 1', 'Central Lab', 'Pharmacy Store', 'General Ward A'];
    const randomDept = depts[Math.floor(Math.random() * depts.length)];
    injectMockSpike(randomDept);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-sans">
            Gateway Alarm Logs
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Review BEMS sensor thresholds breaches and critical power disruptions
          </p>
        </div>

        {user?.role === 'Admin' && (
          <Button
            onClick={handleInjectSpike}
            variant="glass"
            size="sm"
            className="flex items-center gap-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
          >
            <PlusCircle size={14} />
            Inject Spike Alarm
          </Button>
        )}
      </div>

      {/* Filter Tabs and Lists */}
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
              filter === 'all' 
                ? 'bg-slate-900 border border-slate-800 text-cyan-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All Logs ({alerts.length})
          </button>
          
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
              filter === 'active' 
                ? 'bg-slate-900 border border-slate-800 text-rose-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Active ({activeAlerts.length})
          </button>

          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
              filter === 'resolved' 
                ? 'bg-slate-900 border border-slate-800 text-emerald-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Resolved ({resolvedAlerts.length})
          </button>
        </div>

        {getFilteredAlerts().length === 0 ? (
          <div className="p-12 bg-slate-900/20 border border-slate-800 rounded-3xl text-center text-slate-400 font-semibold text-sm">
            No alarms logged for filter: <strong className="text-slate-200 capitalize">{filter}</strong>.
          </div>
        ) : (
          <AlertCards maxCount={null} />
        )}
      </div>
    </div>
  );
}
