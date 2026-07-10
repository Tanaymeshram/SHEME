import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function NotificationPanel({ isOpen, onClose }) {
  const { alerts, acknowledgeAlert } = useApp();
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Panel content wrapper */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-400 animate-bounce" />
                    Active Alarms
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
                    {activeAlerts.length} Critical Breaches Pending
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-3xl">
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-300">All Grids Stable</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        No active sensory breaches or load drops are currently logged in the BEMS gateway.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeAlerts.map(alert => (
                    <div 
                      key={alert.id}
                      className={`p-4 bg-slate-950/50 border ${
                        alert.severity === 'Critical' ? 'border-rose-500/20' : 'border-amber-500/20'
                      } rounded-2xl space-y-2 hover:border-slate-700/50 transition-colors`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {alert.timestamp.split(' ')[1]}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">{alert.department}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{alert.message}</p>
                      </div>

                      <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/40">
                        <span>Val: <strong className="text-cyan-400">{alert.value}</strong></span>
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors font-bold"
                        >
                          <Check size={10} className="text-emerald-400" />
                          Ack
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
