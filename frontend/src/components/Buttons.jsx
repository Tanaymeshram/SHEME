import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  type = 'button',
  disabled = false,
  className = '' 
}) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-hospital-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 focus:ring-blue-500/50',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 focus:ring-slate-700/50',
    warning: 'bg-hospital-amber hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 focus:ring-amber-500/50',
    danger: 'bg-hospital-rose hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 focus:ring-rose-500/50',
    glass: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 focus:ring-white/20 backdrop-blur-sm'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-3'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
