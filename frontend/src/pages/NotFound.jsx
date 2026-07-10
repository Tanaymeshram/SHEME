import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import Button from '../components/Buttons';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl animate-bounce shadow-lg shadow-rose-500/5">
        <ShieldAlert size={48} />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-black text-slate-100 tracking-tight uppercase">404 - Grid Segment Missing</h1>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          The BEMS gateway node was unable to route your request. The specified telemetry channel does not exist or has been shunted.
        </p>
      </div>

      <Link to="/" className="pt-2">
        <Button variant="glass" className="flex items-center gap-2">
          <Home size={14} />
          Return to Command Center
        </Button>
      </Link>
    </div>
  );
}
