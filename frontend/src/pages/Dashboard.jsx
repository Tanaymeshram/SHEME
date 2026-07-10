import React from 'react';
import WelcomeHeader from '../components/WelcomeHeader';
import DashboardCards from '../components/DashboardCards';
import ChartsSection from '../components/ChartsSection';
import AlertCards from '../components/AlertCards';
import RoomCards from '../components/RoomCards';
import { useApp } from '../context/AppContext';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { alerts, injectMockSpike, user } = useApp();
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Welcome Greeting Header Banner */}
      <WelcomeHeader />

      {/* 2. KPI Metrics Cards */}
      <DashboardCards />

      {/* 3. Realtime streaming graphs and logs */}
      <ChartsSection />

      {/* 4. Rooms status highlights */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-200">Department Status</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Hospital Wings Climate</p>
          </div>
          <Link 
            to="/rooms"
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-extrabold uppercase tracking-wider transition-colors"
          >
            Manage Wings
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <RoomCards />
      </div>

      {/* 5. Alerts Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-200">Recent System Breaches</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Gateway alarm logs</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick action to trigger simulation testing */}
            {user?.role === 'Admin' && (
              <button
                onClick={() => injectMockSpike('Emergency ER')}
                className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-extrabold text-slate-400 hover:text-slate-200 rounded-lg uppercase tracking-wider transition-all duration-200"
              >
                Inject Mock ER Spike
              </button>
            )}
            <Link 
              to="/alerts"
              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-extrabold uppercase tracking-wider transition-colors"
            >
              View Full Logs
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="p-6 bg-slate-900/20 border border-slate-800 rounded-3xl flex items-center justify-center gap-3 text-slate-400 font-semibold text-sm">
            <AlertCircle size={18} className="text-emerald-400" />
            No active sensory breaches or load drops are currently logged in BEMS.
          </div>
        ) : (
          <AlertCards maxCount={3} />
        )}
      </div>
    </div>
  );
}
