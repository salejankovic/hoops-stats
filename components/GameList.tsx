
import React, { useState, useMemo } from 'react';
import { GameEntry, SortField } from '../types';

interface GameListProps {
  games: GameEntry[];
  onEdit: (game: GameEntry) => void;
  onDelete: (id: string) => void;
}

export const GameList: React.FC<GameListProps> = ({ games, onEdit, onDelete }) => {
  const [activeSeason, setActiveSeason] = useState<string>('All seasons');
  const [filterComp, setFilterComp] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [showBest, setShowBest] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<'All' | 'W' | 'L'>('All');
  const [venueFilter, setVenueFilter] = useState<'All' | 'Home' | 'Away'>('All');

  const seasons = useMemo(() => {
    const s = Array.from(new Set(games.map(g => g.season))) as string[];
    return ['All seasons', ...s.sort((a, b) => b.localeCompare(a))];
  }, [games]);

  // Count games per season
  const getSeasonCount = (season: string) => {
    if (season === 'All seasons') return games.length;
    return games.filter(g => g.season === season).length;
  };

  const filteredGamesForSeason = useMemo(() => {
    return games
      .filter(g => activeSeason === 'All seasons' || g.season === activeSeason)
      .filter(g => filterComp === 'All' || g.competition === filterComp)
      .filter(g => {
        // Search filter - check opponent and date
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return g.opponent.toLowerCase().includes(query) || g.date.includes(query);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') return new Date(b.date.split('.').reverse().join('-')).getTime() - new Date(a.date.split('.').reverse().join('-')).getTime();
        const valA = a.isDnp ? -1 : a.stats[sortBy as keyof typeof a.stats];
        const valB = b.isDnp ? -1 : b.stats[sortBy as keyof typeof b.stats];
        return valB - valA;
      });
  }, [games, activeSeason, filterComp, sortBy, searchQuery]);

  const compsInActiveSeason = useMemo(() => {
    const relevantGames = activeSeason === 'All seasons' ? games : games.filter(g => g.season === activeSeason);
    const comps = Array.from(new Set(relevantGames.map(g => g.competition)));
    return ['All', ...comps];
  }, [games, activeSeason]);

  // Count games per competition
  const getCompetitionCount = (comp: string) => {
    const relevantGames = activeSeason === 'All seasons' ? games : games.filter(g => g.season === activeSeason);
    if (comp === 'All') return relevantGames.length;
    return relevantGames.filter(g => g.competition === comp).length;
  };

  const displayGames = showBest ? [...filteredGamesForSeason].filter(g => !g.isDnp).sort((a, b) => b.stats.indexRating - a.stats.indexRating).slice(0, 10) : filteredGamesForSeason;

  // Calculate season averages
  const seasonStats = useMemo(() => {
    const activeGames = filteredGamesForSeason.filter(g => !g.isDnp);
    if (activeGames.length === 0) return null;

    const totalMinutes = activeGames.reduce((sum, g) => sum + g.stats.minutes, 0);
    const totalPoints = activeGames.reduce((sum, g) => sum + g.stats.points, 0);
    const totalRebounds = activeGames.reduce((sum, g) => sum + g.stats.rebounds, 0);
    const totalAssists = activeGames.reduce((sum, g) => sum + g.stats.assists, 0);
    const totalPIR = activeGames.reduce((sum, g) => sum + g.stats.indexRating, 0);

    // Calculate shooting percentages
    const total2PtMade = activeGames.reduce((sum, g) => sum + g.stats.twoPtMade, 0);
    const total2PtAtt = activeGames.reduce((sum, g) => sum + g.stats.twoPtAtt, 0);
    const total3PtMade = activeGames.reduce((sum, g) => sum + g.stats.threePtMade, 0);
    const total3PtAtt = activeGames.reduce((sum, g) => sum + g.stats.threePtAtt, 0);
    const totalFTMade = activeGames.reduce((sum, g) => sum + g.stats.ftMade, 0);
    const totalFTAtt = activeGames.reduce((sum, g) => sum + g.stats.ftAtt, 0);

    const fg2Percentage = total2PtAtt > 0 ? ((total2PtMade / total2PtAtt) * 100).toFixed(1) : '0.0';
    const fg3Percentage = total3PtAtt > 0 ? ((total3PtMade / total3PtAtt) * 100).toFixed(1) : '0.0';
    const ftPercentage = totalFTAtt > 0 ? ((totalFTMade / totalFTAtt) * 100).toFixed(1) : '0.0';

    return {
      ppg: (totalPoints / activeGames.length).toFixed(1),
      rpg: (totalRebounds / activeGames.length).toFixed(1),
      apg: (totalAssists / activeGames.length).toFixed(1),
      pir: (totalPIR / activeGames.length).toFixed(1),
      mpg: (totalMinutes / activeGames.length).toFixed(1),
      gamesPlayed: activeGames.length,
      fg2Percentage,
      fg3Percentage,
      ftPercentage
    };
  }, [filteredGamesForSeason]);

  if (seasons.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-40 text-slate-600">
          <svg className="w-24 h-24 mb-6 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="font-black tracking-[0.3em] uppercase text-sm">NO GAMES RECORDED</p>
          <p className="text-xs font-bold mt-2 opacity-40">Tap the + button to add your first game</p>
        </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Quick Stats Summary */}
      {seasonStats && (
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 border-2 border-slate-800/50 rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            {/* PPG */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">PPG</span>
              <span className="font-black oswald text-2xl text-orange-500">{seasonStats.ppg}</span>
            </div>
            {/* RPG */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">RPG</span>
              <span className="font-black oswald text-2xl text-white">{seasonStats.rpg}</span>
            </div>
            {/* APG */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">APG</span>
              <span className="font-black oswald text-2xl text-white">{seasonStats.apg}</span>
            </div>
            {/* PIR */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">PIR</span>
              <span className="font-black oswald text-2xl text-orange-500">{seasonStats.pir}</span>
            </div>
            {/* 2PT % */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">2PT%</span>
              <span className="font-black oswald text-2xl text-white">{seasonStats.fg2Percentage}%</span>
            </div>
            {/* 3PT % */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">3PT%</span>
              <span className="font-black oswald text-2xl text-white">{seasonStats.fg3Percentage}%</span>
            </div>
            {/* FT % */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">FT%</span>
              <span className="font-black oswald text-2xl text-white">{seasonStats.ftPercentage}%</span>
            </div>
            {/* Average Minutes */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-xl border border-slate-800 col-span-3 md:col-span-4 lg:col-span-1">
              <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">MPG</span>
              <div className="flex flex-col items-center">
                <span className="font-black oswald text-2xl text-white">{seasonStats.mpg}</span>
                <span className="text-xs text-slate-600 font-bold mt-1">{seasonStats.gamesPlayed} GP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Season Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b-2 border-slate-900">
          {seasons.map(s => (
            <button
              key={s}
              onClick={() => { setActiveSeason(s); setFilterComp('All'); }}
              className={`px-6 py-3 rounded-t-xl text-sm font-black whitespace-nowrap transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${
                activeSeason === s
                  ? 'bg-slate-900 text-white border-b-4 border-orange-600'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/30'
              }`}
            >
              <span>{s === 'All seasons' ? '🏀 ALL SEASONS' : `SEASON ${s}`}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeSeason === s ? 'bg-orange-600/30 text-orange-300' : 'bg-slate-800 text-slate-500'}`}>
                {getSeasonCount(s)}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by opponent or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border-slate-800 border-2 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 outline-none transition-all placeholder-slate-600"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 gap-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black oswald text-white tracking-tight">
              {activeSeason === 'All seasons' ? 'ALL GAMES' : `SEASON ${activeSeason}`}
            </h2>
            <span className="text-slate-600 text-sm font-black">
              ({filteredGamesForSeason.length} {filteredGamesForSeason.length === 1 ? 'game' : 'games'})
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white'}`}
                  title="Gallery View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white'}`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button
                  onClick={() => setShowBest(!showBest)}
                  className={`text-[10px] font-black transition-all px-6 py-2.5 rounded-full border-2 ${showBest ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-lg shadow-orange-500/10' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
              >
                  TOP 10 BEST
              </button>
              <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-600 font-black text-[10px] tracking-widest">SORT:</span>
                  <select
                      className="bg-transparent border-none focus:ring-0 font-black text-[10px] uppercase text-slate-300 p-0 cursor-pointer hover:text-white"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortField)}
                  >
                      <option value="date" className="bg-slate-900">Date</option>
                      <option value="points" className="bg-slate-900">Points</option>
                      <option value="indexRating" className="bg-slate-900">Index</option>
                      <option value="rebounds" className="bg-slate-900">Rebounds</option>
                      <option value="assists" className="bg-slate-900">Assists</option>
                      <option value="minutes" className="bg-slate-900">Minutes</option>
                  </select>
              </div>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {compsInActiveSeason.map(c => (
          <button
              key={c}
              onClick={() => setFilterComp(c)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black whitespace-nowrap border-2 transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${
              filterComp === c ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-600/20' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
          >
              <span>{c}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${filterComp === c ? 'bg-white/20' : 'bg-slate-800'}`}>
                {getCompetitionCount(c)}
              </span>
          </button>
          ))}
        </div>
      </div>

      {/* Gallery View - Wider Cards */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
          {displayGames.map((game) => (
            <div
              key={game.id}
              className={`bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl group hover:border-orange-500/40 transition-all duration-500 ${game.isDnp ? 'opacity-60' : ''}`}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-4 py-2 rounded-xl uppercase tracking-widest group-hover:bg-slate-700 transition-all">{game.competition}</span>
                    <span className="text-xs text-slate-600 font-black uppercase tracking-tighter">{game.date}</span>
                    {game.isOvertime && <span className="text-[9px] font-black bg-amber-900/40 text-amber-400 px-3 py-1.5 rounded-xl uppercase tracking-widest">OT</span>}
                  </div>
                  {game.isDnp && <span className="text-[10px] font-black bg-red-900/40 text-red-400 px-4 py-2 rounded-xl uppercase tracking-widest">DNP</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-3xl text-white truncate oswald tracking-tight group-hover:text-orange-50 transition-colors">
                    {game.isHome ? 'vs ' : '@ '}{game.opponent}
                  </h4>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`text-2xl font-black oswald ${game.result === 'W' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {game.result} {game.finalScore}
                    </span>
                    <span className="text-slate-600 text-xs font-black tracking-widest">({game.seasonRecord})</span>
                  </div>
                </div>

                {game.isGameWinner && (
                  <div className="mt-5 flex items-center justify-center py-3 bg-orange-600/10 border border-orange-500/20 rounded-xl">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] animate-pulse">GAME WINNER 🎯</span>
                  </div>
                )}

                {game.isDnp && (
                  <div className="mt-6 p-5 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">DNP REASON</p>
                    <p className="text-sm font-bold text-slate-400 italic">"{game.dnpReason || 'No details provided'}"</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/50 px-8 py-6 border-t-2 border-slate-800 group-hover:bg-slate-950/80 transition-all">
                {!game.isDnp ? (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">MIN</span>
                      <span className="font-black oswald text-xl md:text-2xl text-white">{game.stats.minutes}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">PTS</span>
                      <span className="font-black oswald text-xl md:text-2xl text-white">{game.stats.points}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">REB</span>
                      <span className="font-black oswald text-xl md:text-2xl text-white">{game.stats.rebounds}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">AST</span>
                      <span className="font-black oswald text-xl md:text-2xl text-white">{game.stats.assists}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-orange-600/10 rounded-xl border-2 border-orange-500/30 col-span-2 md:col-span-1">
                      <span className="text-orange-500/70 font-black uppercase text-[8px] tracking-[0.2em] mb-1.5">PIR</span>
                      <span className="font-black oswald text-xl md:text-2xl text-orange-500">{game.stats.indexRating}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-slate-700 font-black tracking-[0.4em] text-xs uppercase py-4">
                    NOT ACTIVE
                  </div>
                )}
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => onEdit(game)} className="p-3 text-slate-600 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => onDelete(game.id)} className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-900/10 rounded-xl transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View - Compact Rows */}
      {viewMode === 'list' && (
        <div className="space-y-3 pb-20">
          {displayGames.map((game) => (
          <div
            key={game.id}
            className={`bg-slate-900 rounded-2xl border-2 border-slate-800 shadow-xl group hover:border-orange-500/40 transition-all duration-300 ${game.isDnp ? 'opacity-60' : ''}`}
          >
            <div className="p-5 flex items-center gap-4">
              {/* Left: Date & Competition */}
              <div className="flex flex-col items-start gap-1.5 min-w-[120px]">
                <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg uppercase tracking-widest group-hover:bg-slate-700 transition-all">{game.competition}</span>
                <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">{game.date}</span>
              </div>

              {/* Center: Opponent & Score */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-lg text-white truncate oswald tracking-tight group-hover:text-orange-50 transition-colors">
                    {game.isHome ? 'vs ' : '@ '}{game.opponent}
                  </h4>
                  {game.isDnp && <span className="text-[8px] font-black bg-red-900/40 text-red-400 px-2 py-1 rounded-lg uppercase tracking-widest">DNP</span>}
                  {game.isGameWinner && <span className="text-[8px] font-black bg-orange-600/30 text-orange-500 px-2 py-1 rounded-lg uppercase tracking-widest animate-pulse">🎯 WINNER</span>}
                  {game.isOvertime && <span className="text-[8px] font-black bg-amber-900/40 text-amber-400 px-2 py-1 rounded-lg uppercase tracking-widest">OT</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-base font-black oswald ${game.result === 'W' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {game.result} {game.finalScore}
                  </span>
                  <span className="text-slate-600 text-[10px] font-black tracking-widest">({game.seasonRecord})</span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-4">
                {!game.isDnp ? (
                  <>
                    <div className="text-center">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">MIN</span>
                      <span className="font-black oswald text-lg text-white">{game.stats.minutes}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">PTS</span>
                      <span className="font-black oswald text-lg text-white">{game.stats.points}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">REB</span>
                      <span className="font-black oswald text-lg text-white">{game.stats.rebounds}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-600 font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">AST</span>
                      <span className="font-black oswald text-lg text-white">{game.stats.assists}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center text-slate-700 font-black tracking-[0.3em] text-[9px] uppercase">
                    NOT ACTIVE
                  </div>
                )}
              </div>

              {/* PIR Index */}
              {!game.isDnp && (
                <div className="bg-slate-950 rounded-xl px-4 py-2.5 text-center min-w-[70px] border-2 border-slate-800 group-hover:border-orange-500/40 transition-all shadow-inner">
                  <p className="text-[7px] text-slate-600 font-black uppercase tracking-[0.2em] leading-none mb-1">PIR</p>
                  <p className="oswald text-xl font-black text-orange-500 leading-none">{game.stats.indexRating}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1.5">
                <button onClick={() => onEdit(game)} className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(game.id)} className="p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-900/10 rounded-xl transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};
