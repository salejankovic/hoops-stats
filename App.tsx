
import React, { useState, useEffect, useRef } from 'react';
import { GameEntry, SyncStatus, UserProfile, StorageConfig, AppSettings, TeamConfig, CompetitionConfig } from './types';
import { GameList } from './components/GameList';
import { GameForm } from './components/GameForm';
import { StatsDashboard } from './components/StatsDashboard';
import { SyncSettings } from './components/SyncSettings';
import { TeamCompetitionManager } from './components/TeamCompetitionManager';
import { Auth } from './components/Auth';
import { exportToCSV, exportToJSON } from './utils/parser';
import { storageService } from './services/storage';

// Default settings
const getDefaultSettings = (): AppSettings => ({
  teams: [],
  competitions: []
});

const App: React.FC = () => {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [user, setUser] = useState<UserProfile | null>(storageService.getCurrentUser());
  const [view, setView] = useState<'list' | 'stats' | 'add'>('list');
  const [editingGame, setEditingGame] = useState<GameEntry | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [lastSync, setLastSync] = useState<string | null>(storageService.getLastSync());
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(getDefaultSettings());
  const [appSettingsLoaded, setAppSettingsLoaded] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<StorageConfig>(storageService.getConfig());
  const [activeTeam, setActiveTeam] = useState<'Partizan' | 'Reprezentacija'>('Partizan');
  const hasInitialSyncedRef = useRef(false);

  // Load app settings from Supabase on mount and when user changes
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await storageService.loadAppSettings();
      setAppSettings(settings);
      setAppSettingsLoaded(true);
    };
    setAppSettingsLoaded(false);
    hasInitialSyncedRef.current = false; // Reset sync flag when user changes
    loadSettings();
  }, [user]);

  // Auto-sync teams/competitions from games to settings
  // IMPORTANT: Only run ONCE per session after initial load, not on every page refresh
  useEffect(() => {
    if (games.length > 0 && appSettingsLoaded && !hasInitialSyncedRef.current) {
      hasInitialSyncedRef.current = true; // Mark as synced to prevent future runs

      const existingTeamNames = new Set(appSettings.teams.map(t => t.name.toLowerCase()));
      const existingCompNames = new Set(appSettings.competitions.map(c => c.name.toLowerCase()));

      const newTeams: TeamConfig[] = [];
      const newComps: CompetitionConfig[] = [];

      games.forEach(game => {
        // Add opponent teams that don't exist
        if (game.opponent && !existingTeamNames.has(game.opponent.toLowerCase())) {
          existingTeamNames.add(game.opponent.toLowerCase());
          newTeams.push({
            id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: game.opponent,
            shortName: game.opponent.substring(0, 3).toUpperCase()
          });
        }

        // Add competitions that don't exist
        if (game.competition && !existingCompNames.has(game.competition.toLowerCase())) {
          existingCompNames.add(game.competition.toLowerCase());
          newComps.push({
            id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: game.competition,
            shortName: game.competition.substring(0, 3).toUpperCase()
          });
        }
      });

      if (newTeams.length > 0 || newComps.length > 0) {
        const updatedSettings = {
          teams: [...appSettings.teams, ...newTeams],
          competitions: [...appSettings.competitions, ...newComps]
        };
        setAppSettings(updatedSettings);
        storageService.saveAppSettings(updatedSettings);
      }
    }
  }, [games, appSettingsLoaded]);

  // Handle saving settings from the manager
  const handleSaveSettings = (settings: AppSettings) => {
    setAppSettings(settings);
    storageService.saveAppSettings(settings);
  };

  // Helper to get team logo by name
  const getTeamLogo = (teamName: string): string | undefined => {
    const team = appSettings.teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
    return team?.logo;
  };

  // Helper to get competition logo by name
  const getCompetitionLogo = (compName: string): string | undefined => {
    const comp = appSettings.competitions.find(c => c.name.toLowerCase() === compName.toLowerCase());
    return comp?.logo;
  };

  // Auto-scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, activeTeam]);

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

  // Team theme colors for full page styling
  const themeColors = {
    Partizan: {
      pageBg: 'bg-black',
      headerBg: 'bg-black/90',
      headerBorder: 'border-zinc-800',
      tabsBg: 'bg-zinc-900/50',
      tabsBorder: 'border-zinc-800',
      buttonBg: 'bg-zinc-800/50',
      buttonHover: 'hover:bg-zinc-700',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-400',
      textMuted: 'text-zinc-600',
      accent: 'text-white',
      accentBg: 'bg-white',
      tabActive: 'bg-zinc-800',
      tabIndicator: 'bg-white',
      badgeActive: 'bg-white/20 text-white',
      badgeInactive: 'bg-zinc-800 text-zinc-500',
      syncDot: 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]',
      syncText: 'text-white',
      navBg: 'bg-zinc-900/90',
      navBorder: 'border-zinc-800/50',
      navActive: 'text-white',
      fabBg: 'bg-white',
      fabText: 'text-black',
      fabShadow: 'shadow-[0_20px_40px_rgba(255,255,255,0.2)]',
    },
    Reprezentacija: {
      pageBg: 'bg-blue-950',
      headerBg: 'bg-blue-950/90',
      headerBorder: 'border-blue-900',
      tabsBg: 'bg-blue-900/30',
      tabsBorder: 'border-blue-900',
      buttonBg: 'bg-blue-900/50',
      buttonHover: 'hover:bg-blue-800',
      textPrimary: 'text-white',
      textSecondary: 'text-blue-200',
      textMuted: 'text-blue-400/60',
      accent: 'text-blue-400',
      accentBg: 'bg-blue-500',
      tabActive: 'bg-blue-900/60',
      tabIndicator: 'bg-blue-400',
      badgeActive: 'bg-blue-500/30 text-blue-200',
      badgeInactive: 'bg-blue-900/50 text-blue-400/60',
      syncDot: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]',
      syncText: 'text-blue-400',
      navBg: 'bg-blue-900/90',
      navBorder: 'border-blue-800/50',
      navActive: 'text-blue-400',
      fabBg: 'bg-blue-500',
      fabText: 'text-white',
      fabShadow: 'shadow-[0_20px_40px_rgba(59,130,246,0.3)]',
    }
  };

  const theme = themeColors[activeTeam];

  return (
    <div className={`min-h-screen ${theme.pageBg} flex flex-col relative overflow-x-hidden transition-colors duration-300`}>
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />

      <header className={`${theme.headerBg} backdrop-blur-2xl border-b ${theme.headerBorder} sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="group cursor-pointer" onClick={() => setIsAppReady(false)}>
              <h1 className={`text-2xl font-black oswald tracking-tighter ${theme.textPrimary} uppercase group-hover:scale-105 transition-transform`}>HOOPS<span className={theme.accent}>AI</span></h1>
              <p className={`text-[9px] font-black ${theme.textMuted} uppercase tracking-[0.3em] mt-0.5`}>INTERNAL SYSTEM</p>
            </div>

            <button
              onClick={() => setShowSyncSettings(true)}
              className={`flex items-center gap-2.5 px-4 py-2 ${theme.buttonBg} rounded-2xl border ${theme.headerBorder} ${theme.buttonHover} transition-all group`}
            >
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced' ? theme.syncDot :
                syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' :
                syncStatus === 'unauthorized' ? 'bg-orange-500' :
                syncStatus === 'error' ? 'bg-red-500' :
                'bg-slate-700'
              }`} />
              <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme.textSecondary} group-hover:text-white leading-none`}>
                  {syncStatus === 'synced' ? 'Cloud Active' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : 'Local Only'}
                </span>
                {lastSync && syncStatus === 'synced' && (
                  <span className={`text-[7px] font-black ${theme.syncText} uppercase tracking-widest mt-1 opacity-60`}>Last Sync: {lastSync}</span>
                )}
              </div>
            </button>
          </div>

          <div className="flex gap-2">
            {/* Team & Competition Settings */}
            <button onClick={() => setShowTeamManager(true)} className={`p-3 ${theme.buttonBg} rounded-2xl ${theme.textSecondary} hover:text-white ${theme.buttonHover} transition-all`} title="Team & Competition Settings">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={`p-3 ${theme.buttonBg} rounded-2xl ${theme.textSecondary} hover:text-white ${theme.buttonHover} transition-all`} title="Import Backup">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
            <button onClick={handleExport} className={`p-3 ${theme.buttonBg} rounded-2xl ${theme.textSecondary} hover:text-white ${theme.buttonHover} transition-all`} title="Export Data">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button onClick={handleReset} className={`p-3 ${theme.buttonBg} rounded-2xl ${theme.textSecondary} hover:text-red-500 hover:bg-red-900/10 transition-all`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button onClick={async () => { await storageService.signOut(); window.location.reload(); }} className={`p-3 ${theme.buttonBg} rounded-2xl ${theme.textSecondary} hover:text-red-400 hover:bg-red-900/10 transition-all`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Team Tabs */}
      <div className={`${theme.tabsBg} border-b-2 ${theme.tabsBorder} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTeam('Partizan')}
              className={`px-8 py-5 text-2xl font-black oswald uppercase tracking-tight transition-all relative flex items-center gap-3 ${
                activeTeam === 'Partizan'
                  ? `text-white ${themeColors.Partizan.tabActive}`
                  : `${theme.textMuted} hover:text-white/60 hover:bg-white/5`
              }`}
            >
              <span className="text-2xl">⚫</span>
              <span>PARTIZAN</span>
              <span className={`text-sm px-2.5 py-1 rounded-full font-bold ${activeTeam === 'Partizan' ? themeColors.Partizan.badgeActive : theme.badgeInactive}`}>
                {games.filter((g: GameEntry) => g.team === 'Partizan').length}
              </span>
              {activeTeam === 'Partizan' && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${themeColors.Partizan.tabIndicator}`} />
              )}
            </button>
            <button
              onClick={() => setActiveTeam('Reprezentacija')}
              className={`px-8 py-5 text-2xl font-black oswald uppercase tracking-tight transition-all relative flex items-center gap-3 ${
                activeTeam === 'Reprezentacija'
                  ? `text-white ${themeColors.Reprezentacija.tabActive}`
                  : `${theme.textMuted} hover:text-white/60 hover:bg-white/5`
              }`}
            >
              <span className="text-2xl">🇷🇸</span>
              <span>REPREZENTACIJA</span>
              <span className={`text-sm px-2.5 py-1 rounded-full font-bold ${activeTeam === 'Reprezentacija' ? themeColors.Reprezentacija.badgeActive : theme.badgeInactive}`}>
                {games.filter((g: GameEntry) => g.team === 'Reprezentacija').length}
              </span>
              {activeTeam === 'Reprezentacija' && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${themeColors.Reprezentacija.tabIndicator}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className={view === 'add' ? 'max-w-4xl mx-auto' : ''}>
          {view === 'list' && <GameList games={games.filter(g => g.team === activeTeam)} onEdit={handleEdit} onDelete={handleDelete} activeTeam={activeTeam} appSettings={appSettings} />}
          {view === 'stats' && <StatsDashboard games={games.filter(g => g.team === activeTeam)} />}
          {view === 'add' && (
            <GameForm
              onSave={handleSaveGame}
              onCancel={() => { setView('list'); setEditingGame(null); }}
              initialData={editingGame}
              existingGames={games.filter(g => g.team === activeTeam)}
              activeTeam={activeTeam}
            />
          )}
        </div>
      </main>

      {showSyncSettings && <SyncSettings onClose={() => setShowSyncSettings(false)} />}

      {showTeamManager && (
        <TeamCompetitionManager
          settings={appSettings}
          onSave={handleSaveSettings}
          onClose={() => setShowTeamManager(false)}
          activeTeam={activeTeam}
        />
      )}

      {view !== 'add' && (
        <button
          onClick={() => setView('add')}
          className={`fixed bottom-28 right-8 w-16 h-16 ${theme.fabBg} ${theme.fabShadow} rounded-3xl flex items-center justify-center z-40 active:scale-90 transition-all hover:-translate-y-1 hover:opacity-90`}
        >
          <svg className={`w-8 h-8 ${theme.fabText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <div className={`${theme.navBg} backdrop-blur-2xl border ${theme.navBorder} rounded-[32px] shadow-2xl px-10 py-5 flex justify-between items-center transition-colors duration-300`}>
          <button onClick={() => setView('list')} className={`flex flex-col items-center gap-2 transition-all ${view === 'list' ? `${theme.navActive} scale-110` : `${theme.textSecondary} hover:text-white`}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span className="text-xs font-black uppercase tracking-widest">History</span>
          </button>
          <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-2 transition-all ${view === 'stats' ? `${theme.navActive} scale-110` : `${theme.textSecondary} hover:text-white`}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-xs font-black uppercase tracking-widest">Insights</span>
          </button>
          <button onClick={() => setShowSyncSettings(true)} className={`flex flex-col items-center gap-2 transition-all ${showSyncSettings ? `${theme.navActive} scale-110` : `${theme.textSecondary} hover:text-white`}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-xs font-black uppercase tracking-widest">Storage</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
