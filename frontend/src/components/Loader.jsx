import React from 'react';

export default function Loader({ size = 'md', text = 'Connecting to BEMS Gateway...' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-18 h-18 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Heartbeat pulse glow */}
        <div className="absolute w-16 h-16 rounded-full bg-cyan-500/20 blur-xl animate-pulse-slow"></div>
        {/* Rotating outer spinner ring */}
        <div className={`animate-spin rounded-full border-t-cyan-500 border-r-transparent border-b-cyan-500/20 border-l-transparent ${sizeClasses[size]}`}></div>
        {/* Core pulse dot */}
        <div className="absolute w-4 h-4 rounded-full bg-cyan-400 animate-ping"></div>
      </div>
      {text && (
        <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}
