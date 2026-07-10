import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Legend,
  CartesianGrid
} from 'recharts';

export default function ChartsSection() {
  const { liveData } = useApp();

  // Real-time Trend streaming data
  const trendData = liveData?.live_trend || [];

  // Daily Load balancing data (solar offset vs baseload)
  const dailyData = [
    { hour: '00:00', GridLoad: 85, SolarGen: 0 },
    { hour: '04:00', GridLoad: 80, SolarGen: 0 },
    { hour: '08:00', GridLoad: 120, SolarGen: 20 },
    { hour: '12:00', GridLoad: 145, SolarGen: 75 },
    { hour: '16:00', GridLoad: 130, SolarGen: 45 },
    { hour: '20:00', GridLoad: 105, SolarGen: 0 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase">{label}</p>
          {payload.map((pld, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.color }}></span>
              <span className="text-slate-200">{pld.name}:</span>
              <span className="text-slate-100 font-extrabold">{parseFloat(pld.value).toFixed(1)} {pld.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Real-time stream graph */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-200 font-sans">Live System Load Analysis</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time gateway streaming parameters</p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full uppercase tracking-wider animate-pulse">
            Live Streaming
          </span>
        </div>

        <div className="h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPwr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1677ff" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="consumption" 
                name="Grid Load" 
                unit="kW"
                stroke="#1677ff" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorPwr)" 
              />
              <Area 
                type="monotone" 
                dataKey="voltage" 
                name="Voltage" 
                unit="V"
                stroke="#06b6d4" 
                strokeWidth={1} 
                fillOpacity={1} 
                fill="url(#colorVolt)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Daily peak balancing graph */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-200 font-sans">Daily Renewable Balancing</h3>
            <p className="text-xs text-slate-500 font-medium">Solar power offsetting against peak grid loads</p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full uppercase tracking-wider">
            Optimized
          </span>
        </div>

        <div className="h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }} />
              <Bar dataKey="GridLoad" name="Grid Draw" unit="kW" fill="#1e293b" radius={[4, 4, 0, 0]} border="1px solid rgba(255,255,255,0.05)" />
              <Bar dataKey="SolarGen" name="Solar Offset" unit="kW" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
