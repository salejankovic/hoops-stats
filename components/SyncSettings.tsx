
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { StorageConfig, UserProfile } from '../types';

interface SyncSettingsProps {
  onClose: () => void;
}

// Fixed: Completed the SyncSettings component implementation to ensure it returns a valid ReactNode instead of void.
export const SyncSettings: React.FC<SyncSettingsProps> = ({ onClose }) => {
  const currentConfig = storageService.getConfig();
  const [user, setUser] = useState<UserProfile | null>(storageService.getCurrentUser());
  const [type, setType] = useState<'local' | 'supabase'>(currentConfig.type);
  const [url, setUrl] = useState(currentConfig.supabaseConfig?.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.supabaseConfig?.anonKey || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = storageService.onUserChange(setUser);
    return unsub;
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const newConfig: StorageConfig = {
        type,
        supabaseConfig: type === 'supabase' ? { url, anonKey } : undefined
      };
      await storageService.saveConfig(newConfig);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await storageService.signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black oswald text-white uppercase italic tracking-tight">Storage System</h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('local')}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'local' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
            >
              Local Memory
            </button>
            <button
              type="button"
              onClick={() => setType('supabase')}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'supabase' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:text-slate-400'}`}
            >
              Supabase Cloud
            </button>
          </div>

          {type === 'supabase' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Project URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                    placeholder="https://xyz.supabase.co"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Anon API Key</label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                    placeholder="eyJhbGci..."
                  />
                </div>
              </div>

              {user && (
                <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">CONNECTED ACCOUNT</p>
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-3xl text-center space-y-4">
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                Data is stored in your browser's local memory. Switch to cloud for multi-device sync.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-[10px] text-red-400 font-bold uppercase text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-[2] py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-950/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Initialize Storage'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
