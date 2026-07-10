import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, ShieldAlert, HeartPulse } from 'lucide-react';
import Button from '../components/Buttons';

export default function Login() {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Technician');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, name, role);
        setSuccess('Account created successfully. You can now login.');
        setIsLogin(true);
        setName('');
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Dynamic backdrop lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse-slow pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative z-10 backdrop-blur-md">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl mb-3 text-cyan-400 glow-active shadow-lg shadow-cyan-500/5">
            <HeartPulse size={36} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tracking-tight uppercase">
            SHEMS Core Console
          </h1>
          <p className="text-slate-400 text-xs mt-1 text-center font-semibold">
            Enterprise Hospital BEMS portal
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {success && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert size={16} className="text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-bold text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. admin, manager, or tech"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-bold text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              placeholder="e.g. admin123, manager123, or tech123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-bold text-slate-100"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Operator Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-bold text-slate-100 uppercase"
              >
                <option value="Technician">Technician</option>
                <option value="Energy Manager">Energy Manager</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 text-xs font-bold uppercase tracking-wider"
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Enter Dashboard' : 'Register Operator')}
          </Button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => { setIsLogin(prev => !prev); setError(''); setSuccess(''); }}
              className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider font-bold"
            >
              {isLogin ? 'Create credentials' : 'Back to login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
