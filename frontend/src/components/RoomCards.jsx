import React from 'react';
import { useApp } from '../context/AppContext';
import { round, getStatusColorClass } from '../utils/helpers';
import { 
  Thermometer, 
  Droplet, 
  Wind, 
  Users, 
  Zap,
  Power,
  Flame,
  Sun,
  Snowflake
} from 'lucide-react';

export default function RoomCards() {
  const { rooms, toggleRoomControl, user } = useApp();

  // If rooms list hasn't loaded, provide skeleton
  if (!rooms || rooms.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-slate-900/20 border border-slate-800 rounded-3xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  const isOperator = user && ['Admin', 'Energy Manager', 'Technician'].includes(user.role);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => {
        const statusClass = getStatusColorClass(room.status);
        return (
          <div 
            key={room.id}
            className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-slate-700/50 transition-all duration-300 group"
          >
            {/* Top title and status indicator */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-base font-bold text-slate-200 group-hover:text-slate-100 transition-colors">
                  {room.name}
                </h4>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
                  Hospital Wing Grid
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusClass}`}>
                {room.status}
              </span>
            </div>

            {/* Environmental reading grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Thermometer size={10} /> Temp
                </span>
                <span className="text-sm font-bold text-slate-200 block">
                  {round(room.temp, 1)}°C
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Droplet size={10} /> Humidity
                </span>
                <span className="text-sm font-bold text-slate-200 block">
                  {room.humidity}%
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Wind size={10} /> CO₂
                </span>
                <span className={`text-sm font-bold block ${room.co2 > 700 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {room.co2} ppm
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Users size={10} /> Occupancy
                </span>
                <span className="text-sm font-bold text-slate-200 block">
                  {room.occupancy} <span className="text-xs text-slate-500">/ {room.maxOccupancy}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Zap size={10} /> Active Draw
                </span>
                <span className="text-sm font-bold text-slate-200 block">
                  {round(room.power, 1)} kW
                </span>
              </div>
            </div>

            {/* HVAC Controller toggles */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Climate Overrides
              </span>

              <div className="flex gap-2.5">
                {/* Cooling Toggle */}
                <button
                  disabled={!isOperator}
                  onClick={() => toggleRoomControl(room.id, 'cooling', !room.cooling)}
                  className={`p-2 rounded-xl border transition-all duration-200 ${
                    room.cooling 
                      ? 'bg-cyan-500/25 border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-500/10' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                  title="Cooling System (AC)"
                >
                  <Snowflake size={14} className={room.cooling ? 'animate-pulse' : ''} />
                </button>

                {/* Heating Toggle */}
                <button
                  disabled={!isOperator}
                  onClick={() => toggleRoomControl(room.id, 'heating', !room.heating)}
                  className={`p-2 rounded-xl border transition-all duration-200 ${
                    room.heating 
                      ? 'bg-amber-500/25 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/10' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                  title="Heating System"
                >
                  <Flame size={14} className={room.heating ? 'animate-pulse' : ''} />
                </button>

                {/* Lighting Toggle */}
                <button
                  disabled={!isOperator}
                  onClick={() => toggleRoomControl(room.id, 'lighting', !room.lighting)}
                  className={`p-2 rounded-xl border transition-all duration-200 ${
                    room.lighting 
                      ? 'bg-yellow-500/25 border-yellow-500/40 text-yellow-400 shadow-md shadow-yellow-500/10' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                  title="Lamps / Lighting"
                >
                  <Sun size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
