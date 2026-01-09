
import React, { useState, useEffect, useRef } from 'react';
import { GameEntry, SyncStatus, UserProfile, StorageConfig } from './types';
import { GameList } from './components/GameList';
import { GameForm } from './components/GameForm';
import { StatsDashboard } from './components/StatsDashboard';
import { SyncSettings } from './components/SyncSettings';
import { Auth } from './components/Auth';
import { exportToCSV, exportToJSON } from './utils/parser';
import { storageService } from './services/storage';

const App: React.FC = () => {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [user, setUser] = useState<UserProfile | null>(storageService.getCurrentUser());
  const [view, setView] = useState<'list' | 'stats' | 'add'>('list');
  const [editingGame, setEditingGame] = useState<GameEntry | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [lastSync, setLastSync] = useState<string | null>(storageService.getLastSync());
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<StorageConfig>(storageService.getConfig());
  const [activeTeam, setActiveTeam] = useState<'Partizan' | 'Reprezentacija'>('Partizan');

  useEffect(() => {
    const unsubStatus = storageService.onStatusChange(setSyncStatus);
    const unsubUser = storageService.onUserChange(setUser);
    const unsubConfig = storageService.onConfigChange(setConfig);
    const unsubSync = storageService.onSyncChange(setLastSync);

    return () => {
      unsubStatus();
      unsubUser();
      unsubConfig();
      unsubSync();
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      const loaded = await storageService.loadGames();
      // Migrate existing games without team field to Partizan
      const migratedGames = loaded.map(game => ({
        ...game,
        team: game.team || 'Partizan'
      })) as GameEntry[];

      // Save migrated data if any games were updated
      const needsMigration = loaded.some(g => !(g as any).team);
      if (needsMigration) {
        await storageService.saveGames(migratedGames);
      }

      setGames(migratedGames);
    };
    init();
  }, [user, config]);

  const handleSaveGame = async (gameData: Partial<GameEntry>) => {
    let newGames: GameEntry[];
    if (editingGame) {
      newGames = games.map(g => g.id === editingGame.id ? { ...g, ...gameData } as GameEntry : g);
      setEditingGame(null);
    } else {
      // Add team to new game data
      newGames = [{ ...gameData, team: activeTeam } as GameEntry, ...games];
    }
    setGames(newGames);
    await storageService.saveGames(newGames);
    setView('list');
  };

  const handleEdit = (game: GameEntry) => {
    setEditingGame(game);
    setView('add');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this game entry forever?")) {
      const newGames = games.filter(g => g.id !== id);
      setGames(newGames);
      await storageService.deleteGame(id);
      await storageService.saveGames(newGames);
    }
  };

  const handleExport = () => {
    const choice = confirm("Export to Excel/CSV? (Cancel for JSON Backup)");
    if (choice) exportToCSV(games);
    else exportToJSON(games);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedGames = JSON.parse(content);
        if (Array.isArray(importedGames)) {
          if (confirm(`Import ${importedGames.length} games? This will replace existing data.`)) {
            setGames(importedGames);
            await storageService.saveGames(importedGames);
          }
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReset = async () => {
    if (confirm("Wipe all data? This cannot be reversed.")) {
      setGames([]);
      await storageService.saveGames([]);
    }
  };

  // Always require login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
        <Auth onAuthSuccess={() => setIsAppReady(true)} />
      </div>
    );
  }

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="space-y-4">
            <h1 className="text-7xl font-black oswald tracking-tighter text-white uppercase italic">
              HOOPS<span className="text-orange-600">AI</span>
            </h1>
            <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em]">ELITE PERFORMANCE TRACKER</p>
          </div>

          <div className="space-y-4">
              <button
              onClick={() => setIsAppReady(true)}
              className="w-full max-w-xs py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(234,88,12,0.3)] transition-all active:scale-95 text-sm"
            >
              ENTER ARENA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-x-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />

      <header className="bg-slate-950/80 backdrop-blur-2xl border-b border-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="group cursor-pointer" onClick={() => setIsAppReady(false)}>
              <h1 className="text-2xl font-black oswald tracking-tighter text-white uppercase group-hover:scale-105 transition-transform">HOOPS<span className="text-orange-600">AI</span></h1>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mt-0.5">INTERNAL SYSTEM</p>
            </div>
            
            <button 
              onClick={() => setShowSyncSettings(true)}
              className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all group"
            >
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 
                syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 
                syncStatus === 'unauthorized' ? 'bg-orange-500' :
                syncStatus === 'error' ? 'bg-red-500' :
                'bg-slate-700'
              }`} />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 leading-none">
                  {syncStatus === 'synced' ? 'Cloud Active' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : 'Local Only'}
                </span>
                {lastSync && syncStatus === 'synced' && (
                  <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-1 opacity-60">Last Sync: {lastSync}</span>
                )}
              </div>
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-900/50 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
            <button onClick={handleExport} className="p-3 bg-slate-900/50 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button onClick={handleReset} className="p-3 bg-slate-900/50 rounded-2xl text-slate-500 hover:text-red-500 hover:bg-red-900/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button onClick={async () => { await storageService.signOut(); window.location.reload(); }} className="p-3 bg-slate-900/50 rounded-2xl text-slate-500 hover:text-orange-500 hover:bg-orange-900/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Team Tabs */}
      <div className="bg-slate-900/30 border-b-2 border-slate-900">
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTeam('Partizan')}
              className={`px-8 py-5 text-xl font-black oswald uppercase tracking-tight transition-all relative flex items-center gap-3 ${
                activeTeam === 'Partizan'
                  ? 'text-white bg-slate-900/50'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/20'
              }`}
            >
              <span className="text-2xl">⚫</span>
              <span>PARTIZAN</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${activeTeam === 'Partizan' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {games.filter(g => g.team === 'Partizan').length}
              </span>
              {activeTeam === 'Partizan' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTeam('Reprezentacija')}
              className={`px-8 py-5 text-xl font-black oswald uppercase tracking-tight transition-all relative flex items-center gap-3 ${
                activeTeam === 'Reprezentacija'
                  ? 'text-white bg-slate-900/50'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/20'
              }`}
            >
              <span className="text-2xl">🇷🇸</span>
              <span>REPREZENTACIJA</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${activeTeam === 'Reprezentacija' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {games.filter(g => g.team === 'Reprezentacija').length}
              </span>
              {activeTeam === 'Reprezentacija' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className={view === 'add' ? 'max-w-4xl mx-auto' : ''}>
          {view === 'list' && <GameList games={games.filter(g => g.team === activeTeam)} onEdit={handleEdit} onDelete={handleDelete} />}
          {view === 'stats' && <StatsDashboard games={games.filter(g => g.team === activeTeam)} />}
          {view === 'add' && (
            <GameForm
              onSave={handleSaveGame}
              onCancel={() => { setView('list'); setEditingGame(null); }}
              initialData={editingGame}
              existingGames={games.filter(g => g.team === activeTeam)}
            />
          )}
        </div>
      </main>

      {showSyncSettings && <SyncSettings onClose={() => setShowSyncSettings(false)} />}

      {view !== 'add' && (
        <button 
          onClick={() => setView('add')}
          className="fixed bottom-28 right-8 w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-[0_20px_40px_rgba(234,88,12,0.3)] z-40 active:scale-90 transition-all hover:bg-orange-500 hover:-translate-y-1"
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/50 rounded-[32px] shadow-2xl px-10 py-5 flex justify-between items-center">
          <button onClick={() => setView('list')} className={`flex flex-col items-center gap-2 transition-all ${view === 'list' ? 'text-orange-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">History</span>
          </button>
          <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-2 transition-all ${view === 'stats' ? 'text-orange-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Insights</span>
          </button>
          <button onClick={() => setShowSyncSettings(true)} className={`flex flex-col items-center gap-2 transition-all ${showSyncSettings ? 'text-orange-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Storage</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
