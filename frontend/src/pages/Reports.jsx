import React, { useState } from 'react';
import { api } from '../services/api';
import Table from '../components/Tables';
import Button from '../components/Buttons';
import { FileText, Download, Calendar, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('Energy Log');
  const [format, setFormat] = useState('csv');
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleDownload = async (e) => {
    e.preventDefault();
    setDownloading(true);
    setSuccessMsg('');

    try {
      await api.downloadReport(reportType, format);
      setSuccessMsg(`Successfully generated and downloaded: ${reportType}.${format}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const dummyLogs = [
    { time: '2026-07-10 18:00', dept: 'ICU Wing B', kw: 34.5, pf: 0.94, temp: 21.5, status: 'Normal' },
    { time: '2026-07-10 18:00', dept: 'Operation Theatre 1', kw: 48.2, pf: 0.96, temp: 18.0, status: 'Normal' },
    { time: '2026-07-10 18:00', dept: 'Emergency ER', kw: 28.1, pf: 0.89, temp: 22.0, status: 'Warning' },
    { time: '2026-07-10 18:00', dept: 'Central Lab', kw: 18.7, pf: 0.92, temp: 20.2, status: 'Normal' },
    { time: '2026-07-10 18:00', dept: 'Pharmacy Store', kw: 12.4, pf: 0.91, temp: 4.5, status: 'Normal' },
    { time: '2026-07-10 18:00', dept: 'General Ward A', kw: 15.2, pf: 0.92, temp: 23.1, status: 'Normal' }
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-sans">
          BEMS Reporting Center
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Query BEMS databases and export historical parameters
        </p>
      </div>

      {/* Export parameters Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Export BEMS Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">Select databases and format constraints</p>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleDownload} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-bold text-slate-100"
            >
              <option value="Energy Log">Energy Logs & Voltages</option>
              <option value="Climate Report">Climate & Comfort Logs</option>
              <option value="Alert History">Gateway Breach Histories</option>
              <option value="Idle Equipment Log">Idle Equipment Logs</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-bold text-slate-100 uppercase"
            >
              <option value="csv">Standard CSV</option>
              <option value="excel">MS Excel Worksheet</option>
              <option value="pdf">Aesthetic PDF Manual</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Window</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value="LAST 24 HOURS"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 uppercase cursor-not-allowed"
              />
              <Calendar size={14} className="absolute right-4 top-3.5 text-slate-500" />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              disabled={downloading}
              className="w-full py-3.5 text-xs font-bold uppercase tracking-wider"
            >
              <Download size={14} />
              {downloading ? 'Compiling...' : 'Export File'}
            </Button>
          </div>
        </form>
      </div>

      {/* Tabular Database View */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Database Live Logs</h3>
          <p className="text-xs text-slate-500 mt-0.5">Telemetry metrics snapshot for ICU/OT grids</p>
        </div>

        <Table headers={['Timestamp', 'Department', 'Load (kW)', 'Power Factor', 'Temp', 'Status']}>
          {dummyLogs.map((log, i) => (
            <tr key={i} className="hover:bg-slate-800/10 transition-colors">
              <td className="px-6 py-4 text-xs font-bold text-slate-400">{log.time}</td>
              <td className="px-6 py-4 font-bold text-slate-200">{log.dept}</td>
              <td className="px-6 py-4 font-extrabold text-cyan-400">{log.kw} kW</td>
              <td className="px-6 py-4 font-bold text-slate-300">{log.pf}</td>
              <td className="px-6 py-4 font-bold text-slate-300">{log.temp}°C</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  log.status === 'Warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {log.status}
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
