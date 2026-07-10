import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Activity, 
  LayoutGrid, 
  Zap, 
  FileText, 
  Cpu, 
  AlertTriangle, 
  Server, 
  Settings, 
  LogOut,
  User,
  HeartPulse
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, alerts } = useApp();
  const activeAlertsCount = alerts.filter(a => !a.resolved).length;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Rooms & Wings', path: '/rooms', icon: LayoutGrid },
    { name: 'Energy Monitor', path: '/energy', icon: Zap },
    { name: 'Reports & Logs', path: '/reports', icon: FileText },
    { name: 'AI Insights', path: '/ai-insights', icon: Cpu },
    { name: 'Active Alerts', path: '/alerts', icon: AlertTriangle, badge: activeAlertsCount },
    { name: 'Equipment health', path: '/equipment', icon: Server },
    { name: 'BEMS Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between fixed h-full z-20 hidden lg:flex">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3.5 border-b border-slate-800/60 bg-slate-950/20">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl glow-active shadow-lg shadow-cyan-500/5">
            <HeartPulse size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm leading-tight tracking-wider text-slate-100 uppercase">
              SHEMS Admin
            </h2>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-widest mt-0.5 leading-none">
              Hospital BEMS
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 m-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 rounded-full">
            <User size={16} />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-extrabold text-slate-200 truncate leading-tight">
              {user?.name || 'Loading...'}
            </h4>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
              {user?.role || 'Operator'}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="px-3 mt-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-blue-500/10 border border-cyan-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="group-hover:scale-105 transition-transform" />
                  <span>{item.name}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded-full leading-none animate-pulse shadow-md shadow-rose-500/25">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer Section */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
}
