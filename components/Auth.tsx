
import React, { useState } from 'react';
import { storageService } from '../services/storage';

interface AuthProps {
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await storageService.signIn(email, password);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black oswald tracking-tighter text-white uppercase italic">
            HOOPS<span className="text-orange-600">AI</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Personal Performance Tracker</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 text-sm text-white focus:border-orange-500 outline-none transition-all placeholder-slate-700"
                  placeholder="your@email.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 text-sm text-white focus:border-orange-500 outline-none transition-all placeholder-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-[10px] text-red-400 font-bold uppercase text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-3xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-orange-950/40 transition-all active:scale-95 text-sm"
            >
              {loading ? 'Connecting...' : 'Enter Arena'}
            </button>
          </form>
        </div>

        <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          Powered by Gemini AI
        </p>
      </div>
    </div>
  );
};
