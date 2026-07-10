import React from 'react';
import { useApp } from '../context/AppContext';
import { round, formatNumber } from '../utils/helpers';
import { 
  Zap, 
  Activity, 
  Thermometer, 
  Wind, 
  AlertTriangle,
  TrendingUp,
  LayoutGrid,
  Users,
  Grid,
  Droplet,
  CloudLightning
} from 'lucide-react';

export default function DashboardCards() {
  const { liveData } = useApp();

  const kpis = liveData?.kpis || {
    total_energy_consumption_kw: 0.0,
    live_voltage_v: 230.0,
    live_current_a: 0.0,
    avg_temperature_c: 21.5,
    avg_humidity_p: 50.0,
    avg_co2_ppm: 450,
    occupancy_status: 0,
    total_rooms: 0,
    occupied_rooms: 0,
    empty_rooms: 0,
    total_energy_kwh: 0.0,
    equipment_health_score: 95.0,
    active_alerts: 0
  };

  const statItems = [
    {
      title: 'TOTAL POWER DRAW',
      value: formatNumber(kpis.total_energy_consumption_kw, ' kW'),
      icon: Zap,
      color: 'from-cyan-500 to-blue-500',
      textShadow: 'rgba(6, 182, 212, 0.4)',
      subtext: 'Real-time grid load'
    },
    {
      title: 'TOTAL ENERGY CONSUMPTION',
      value: formatNumber(kpis.total_energy_kwh, ' kWh'),
      icon: CloudLightning,
      color: 'from-emerald-500 to-teal-500',
      textShadow: 'rgba(16, 185, 129, 0.4)',
      subtext: 'Cumulative wing draw'
    },
    {
      title: 'BUS VOLTAGE',
      value: formatNumber(kpis.live_voltage_v, ' V'),
      icon: Activity,
      color: 'from-blue-500 to-indigo-500',
      textShadow: 'rgba(59, 130, 246, 0.4)',
      subtext: 'Main grid frequency'
    },
    {
      title: 'LOAD CURRENT',
      value: formatNumber(kpis.live_current_a, ' A'),
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500',
      textShadow: 'rgba(99, 102, 241, 0.4)',
      subtext: 'Active phase current'
    },
    {
      title: 'AVG CLIMATE TEMP',
      value: `${round(kpis.avg_temperature_c, 1)} °C`,
      icon: Thermometer,
      color: 'from-emerald-500 to-teal-500',
      textShadow: 'rgba(16, 185, 129, 0.4)',
      subtext: 'HVAC set point status'
    },
    {
      title: 'AVG HUMIDITY',
      value: `${round(kpis.avg_humidity_p, 1)} %`,
      icon: Droplet,
      color: 'from-cyan-500 to-teal-500',
      textShadow: 'rgba(6, 182, 212, 0.4)',
      subtext: 'Indoor climate comfort'
    },
    {
      title: 'CO₂ AIR QUALITY',
      value: `${kpis.avg_co2_ppm} ppm`,
      icon: Wind,
      color: 'from-purple-500 to-pink-500',
      textShadow: 'rgba(139, 92, 246, 0.4)',
      subtext: 'Indoor safety levels'
    },
    {
      title: 'TOTAL ROOMS',
      value: kpis.total_rooms,
      icon: LayoutGrid,
      color: 'from-slate-500 to-slate-600',
      textShadow: 'rgba(148, 163, 184, 0.4)',
      subtext: 'Monitored grid wings'
    },
    {
      title: 'OCCUPIED WINGS',
      value: kpis.occupied_rooms,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      textShadow: 'rgba(59, 130, 246, 0.4)',
      subtext: 'Active comfort state'
    },
    {
      title: 'EMPTY WINGS',
      value: kpis.empty_rooms,
      icon: Grid,
      color: 'from-slate-600 to-slate-700',
      textShadow: 'rgba(100, 116, 139, 0.4)',
      subtext: 'Eco shunting candidate'
    },
    {
      title: 'ACTIVE ALERTS',
      value: kpis.active_alerts,
      icon: AlertTriangle,
      color: kpis.active_alerts > 0 ? 'from-rose-500 to-red-600' : 'from-slate-500 to-slate-600',
      textShadow: kpis.active_alerts > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(100, 116, 139, 0.4)',
      subtext: kpis.active_alerts > 0 ? 'Urgent breaches logged' : 'No issues logged',
      isAlert: kpis.active_alerts > 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-4 md:gap-5">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div 
            key={index}
            className={`relative overflow-hidden bg-slate-900/40 border ${item.isAlert ? 'border-rose-500/30' : 'border-slate-800'} rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700/50 hover:shadow-glass hover:-translate-y-1 transition-all duration-300 group`}
          >
            {/* Glowing Accent strip on hover */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
            
            <div className="flex justify-between items-start mb-3">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none">
                {item.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-950/40 text-slate-400 group-hover:text-slate-200 transition-colors">
                <Icon size={12} />
              </div>
            </div>

            <div className="space-y-1">
              <span 
                className="text-lg md:text-xl font-black font-sans text-slate-100 tracking-tight block"
                style={{ textShadow: `0 0 12px ${item.textShadow}` }}
              >
                {item.value}
              </span>
              <span className="text-[9px] text-slate-500 uppercase block font-semibold leading-tight">
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
