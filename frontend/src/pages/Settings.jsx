import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import Button from '../components/Buttons';
import { Settings as SettingsIcon, ShieldCheck, Check } from 'lucide-react';

export default function Settings() {
  const { settings, saveSettings, user } = useApp();
  const [success, setSuccess] = useState(false);

  const [hvacTempMin, setHvacTempMin] = useState(18);
  const [hvacTempMax, setHvacTempMax] = useState(26);
  const [co2Threshold, setCo2Threshold] = useState(800);
  const [voltageTolerance, setVoltageTolerance] = useState(10);
  const [currentThreshold, setCurrentThreshold] = useState(150);
  const [loadSheddingMode, setLoadSheddingMode] = useState('Manual');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Sync settings once fetched from context
  useEffect(() => {
    if (settings) {
      setHvacTempMin(settings.hvacTempMin);
      setHvacTempMax(settings.hvacTempMax);
      setCo2Threshold(settings.co2Threshold);
      setVoltageTolerance(settings.voltageTolerance);
      setCurrentThreshold(settings.currentThreshold);
      setLoadSheddingMode(settings.loadSheddingMode);
      setNotificationsEnabled(settings.notificationsEnabled);
    }
  }, [settings]);

  if (!settings) {
    return <Loader text="Querying operational configurations..." />;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccess(false);

    const updated = await saveSettings({
      hvacTempMin: parseFloat(hvacTempMin),
      hvacTempMax: parseFloat(hvacTempMax),
      co2Threshold: parseInt(co2Threshold),
      voltageTolerance: parseFloat(voltageTolerance),
      currentThreshold: parseFloat(currentThreshold),
      loadSheddingMode,
      notificationsEnabled
    });

    if (updated) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const isOperator = user && ['Admin', 'Energy Manager'].includes(user.role);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-sans">
          BEMS Configurations
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Configure alarm thresholds, voltage limits, and automatic load-shedding parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Environmental Thresholds card */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Environmental Safety</h3>
            <p className="text-xs text-slate-500 mt-0.5">HVAC comfort ranges and air quality metrics</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">HVAC Minimum Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                disabled={!isOperator}
                value={hvacTempMin}
                onChange={(e) => setHvacTempMin(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none text-xs font-bold text-slate-100 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">HVAC Maximum Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                disabled={!isOperator}
                value={hvacTempMax}
                onChange={(e) => setHvacTempMax(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none text-xs font-bold text-slate-100 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">CO₂ Safety Threshold (ppm)</label>
              <input
                type="number"
                disabled={!isOperator}
                value={co2Threshold}
                onChange={(e) => setCo2Threshold(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none text-xs font-bold text-slate-100 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Electrical Grid Thresholds card */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Electrical bus Limits</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tolerance metrics for main transformer spikes</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Voltage Tolerance (%)</label>
              <input
                type="number"
                step="0.1"
                disabled={!isOperator}
                value={voltageTolerance}
                onChange={(e) => setVoltageTolerance(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none text-xs font-bold text-slate-100 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Max Bus Current Limit (A)</label>
              <input
                type="number"
                disabled={!isOperator}
                value={currentThreshold}
                onChange={(e) => setCurrentThreshold(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none text-xs font-bold text-slate-100 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Load Shedding Trigger</label>
              <select
                disabled={!isOperator}
                value={loadSheddingMode}
                onChange={(e) => setLoadSheddingMode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none text-xs font-bold text-slate-100 disabled:opacity-50"
              >
                <option value="Manual">Manual Approval Required</option>
                <option value="Semi-Auto">Semi-Automatic Shunting</option>
                <option value="Auto">Fully Automatic Load Shedding</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global BEMS policies card */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Gateway Policies</h3>
              <p className="text-xs text-slate-500 mt-0.5">Toggle notification dispatch protocols</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Dispatch Alarm SMS</span>
                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Alerts technician phone grids</span>
              </div>
              <input
                type="checkbox"
                disabled={!isOperator}
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 text-cyan-600 border-slate-850 rounded focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-4">
            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check size={14} />
                Parameters updated in local gateway storage.
              </div>
            )}

            <Button
              type="submit"
              disabled={!isOperator}
              className="w-full py-3.5 text-xs font-bold uppercase tracking-wider"
            >
              Commit BEMS Thresholds
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
