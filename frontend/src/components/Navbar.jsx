import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Settings, 
  Sun, 
  Moon, 
  Activity, 
  Menu,
  X,
  User,
  LogOut,
  LayoutGrid
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar({ onOpenNotifications }) {
  const { theme, toggleTheme, systemOnline, alerts, user, logout } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlertsCount = alerts.filter(a => !a.resolved).length;

  const mobileNavItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Rooms & Wings', path: '/rooms' },
    { name: 'Energy Monitor', path: '/energy' },
    { name: 'Reports & Logs', path: '/reports' },
    { name: 'AI Insights', path: '/ai-insights' },
    { name: 'Active Alerts', path: '/alerts' },
    { name: 'Equipment health', path: '/equipment' },
    { name: 'BEMS Settings', path: '/settings' }
  ];

  return (
    <header className="h-16 px-6 md:px-8 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
      
      {/* 1. Connection Indicator / Left bar */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors lg:hidden focus:outline-none"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${systemOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-lg shadow-rose-500/50 animate-ping'}`}></span>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${systemOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
            {systemOnline ? 'IoT Gateway Connected' : 'Gateway Offline'}
          </span>
        </div>
      </div>

      {/* 2. Clock, Profile options and widgets */}
      <div className="flex items-center gap-4 md:gap-6 relative">
        {/* System Clock */}
        <span className="hidden sm:inline text-xs font-bold text-slate-400 uppercase tracking-widest">
          {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} &nbsp; 
          <span className="text-slate-200 font-extrabold">{currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors"
          title="Toggle UI Theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors relative"
          title="System Warnings"
        >
          <Bell size={15} />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shadow-md shadow-rose-500/40"></span>
          )}
        </button>

        {/* Quick Settings */}
        <Link
          to="/settings"
          className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors"
          title="BEMS configurations"
        >
          <Settings size={15} />
        </Link>

        {/* Mini operator header */}
        <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4 py-1">
          <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-lg shadow-cyan-600/10">
            {user?.name?.charAt(0) || 'O'}
          </div>
          <span className="hidden md:inline text-xs font-bold text-slate-300">
            {user?.username || 'user'}
          </span>
        </div>
      </div>

      {/* Mobile Drawer Menu (only visible when triggered on smaller displays) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-slate-950/95 z-50 p-6 lg:hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">NAVIGATE</span>
            </div>
            
            <nav className="space-y-2">
              {mobileNavItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    w-full block px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors
                    ${isActive ? 'bg-slate-850 text-cyan-400 border border-slate-800' : 'text-slate-400 hover:bg-slate-900'}
                  `}
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-sm uppercase">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{user?.name}</h4>
                <p className="text-[9px] font-semibold text-slate-500 uppercase">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); logout(); }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-rose-500/20 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              <LogOut size={14} />
              Sign Out Session
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
