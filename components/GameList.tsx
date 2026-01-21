
import React, { useState, useMemo } from 'react';
import { GameEntry, SortField, AppSettings } from '../types';

// Default placeholder logo (simple basketball icon as SVG data URI)
const PLACEHOLDER_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAydjIwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48cGF0aCBkPSJNMTIgMmE4IDggMCAwIDAgOCA4Ii8+PHBhdGggZD0iTTEyIDIyYTggOCAwIDAgMCA4LTgiLz48cGF0aCBkPSJNMTIgMmE4IDggMCAwIDEtOCA4Ii8+PHBhdGggZD0iTTEyIDIyYTggOCAwIDAgMS04LTgiLz48L3N2Zz4=';

interface GameListProps {
  games: GameEntry[];
  onEdit: (game: GameEntry) => void;
  onDelete: (id: string) => void;
  activeTeam?: 'Partizan' | 'Reprezentacija';
  appSettings?: AppSettings;
}

export const GameList: React.FC<GameListProps> = ({ games, onEdit, onDelete, activeTeam = 'Partizan', appSettings }) => {
  // Helper to get team logo by name
  const getTeamLogo = (teamName: string): string => {
    if (!appSettings) {
      return PLACEHOLDER_LOGO;
    }
    const team = appSettings.teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
    return team?.logo || PLACEHOLDER_LOGO;
  };

  // Helper to get competition logo by name
  const getCompetitionLogo = (compName: string): string => {
    if (!appSettings) {
      return PLACEHOLDER_LOGO;
    }
    const comp = appSettings.competitions.find(c => c.name.toLowerCase() === compName.toLowerCase());
    return comp?.logo || PLACEHOLDER_LOGO;
  };
  // Team-based FULL page theming
  // Partizan Belgrade: Black & White classic colors
  // Serbia National Team: Blue & White national colors
  const teamColors = {
    Partizan: {
      // Core colors - pure black and white
      pageBg: 'bg-black',
      cardBg: 'bg-zinc-900',
      cardBorder: 'border-zinc-800',
      cardHoverBorder: 'hover:border-white/40',
      statsBg: 'bg-black/50',
      // Accent - white with subtle styling
      accent: 'bg-white',
      accentText: 'text-white',
      accentBg: 'bg-white/10',
      accentBorder: 'border-white/30',
      // Text colors
      primaryText: 'text-white',
      secondaryText: 'text-zinc-400',
      mutedText: 'text-zinc-600',
      // Interactive elements
      buttonBg: 'bg-white',
      buttonText: 'text-black',
      inputBorder: 'border-zinc-700',
      inputFocus: 'focus:ring-white/30 focus:border-white/50',
      // Shadows and highlights
      shadowColor: 'shadow-white/10',
      tabActive: 'border-white',
      tabBadgeActive: 'bg-white/20 text-white',
    },
    Reprezentacija: {
      // Core colors - Serbian blue and white
      pageBg: 'bg-blue-950',
      cardBg: 'bg-blue-900/80',
      cardBorder: 'border-blue-800',
      cardHoverBorder: 'hover:border-blue-400/40',
      statsBg: 'bg-blue-950/50',
      // Accent - bright blue
      accent: 'bg-blue-500',
      accentText: 'text-blue-400',
      accentBg: 'bg-blue-500/10',
      accentBorder: 'border-blue-400/30',
      // Text colors
      primaryText: 'text-white',
      secondaryText: 'text-blue-200',
      mutedText: 'text-blue-400/60',
      // Interactive elements
      buttonBg: 'bg-blue-500',
      buttonText: 'text-white',
      inputBorder: 'border-blue-700',
      inputFocus: 'focus:ring-blue-400/30 focus:border-blue-400/50',
      // Shadows and highlights
      shadowColor: 'shadow-blue-500/20',
      tabActive: 'border-blue-400',
      tabBadgeActive: 'bg-blue-500/30 text-blue-200',
    }
  };
  const colors = teamColors[activeTeam];
  const [activeSeason, setActiveSeason] = useState<string>('All seasons');
  const [filterComp, setFilterComp] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [showBest, setShowBest] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<'All' | 'W' | 'L'>('All');
  const [venueFilter, setVenueFilter] = useState<'All' | 'Home' | 'Away'>('All');
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  const toggleExpanded = (gameId: string) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

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
        <div className={`${colors.cardBg} border-2 ${colors.cardBorder} rounded-2xl p-4 md:p-6`}>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            {/* PPG */}
            <div className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 ${colors.accentBg} ${colors.accentBorder}`}>
              <span className={`${colors.accentText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>PPG</span>
              <span className={`font-black oswald text-3xl ${colors.accentText}`}>{seasonStats.ppg}</span>
            </div>
            {/* RPG */}
            <div className={`flex flex-col items-center justify-center p-3 ${colors.statsBg} rounded-xl border ${colors.cardBorder}`}>
              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>RPG</span>
              <span className={`font-black oswald text-3xl ${colors.primaryText}`}>{seasonStats.rpg}</span>
            </div>
            {/* APG */}
            <div className={`flex flex-col items-center justify-center p-3 ${colors.statsBg} rounded-xl border ${colors.cardBorder}`}>
              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>APG</span>
              <span className={`font-black oswald text-3xl ${colors.primaryText}`}>{seasonStats.apg}</span>
            </div>
            {/* PIR */}
            <div className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 ${colors.accentBg} ${colors.accentBorder}`}>
              <span className={`${colors.accentText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>PIR</span>
              <span className={`font-black oswald text-3xl ${colors.accentText}`}>{seasonStats.pir}</span>
            </div>
            {/* 2PT % */}
            <div className={`flex flex-col items-center justify-center p-3 ${colors.statsBg} rounded-xl border ${colors.cardBorder}`}>
              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>2PT%</span>
              <span className={`font-black oswald text-3xl ${colors.primaryText}`}>{seasonStats.fg2Percentage}%</span>
            </div>
            {/* 3PT % */}
            <div className={`flex flex-col items-center justify-center p-3 ${colors.statsBg} rounded-xl border ${colors.cardBorder}`}>
              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>3PT%</span>
              <span className={`font-black oswald text-3xl ${colors.primaryText}`}>{seasonStats.fg3Percentage}%</span>
            </div>
            {/* FT % */}
            <div className={`flex flex-col items-center justify-center p-3 ${colors.statsBg} rounded-xl border ${colors.cardBorder}`}>
              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>FT%</span>
              <span className={`font-black oswald text-3xl ${colors.primaryText}`}>{seasonStats.ftPercentage}%</span>
            </div>
            {/* Average Minutes - highlighted similar to PIR */}
            <div className={`flex flex-col items-center justify-center p-3 ${colors.accentBg} rounded-xl border-2 ${colors.accentBorder} col-span-3 md:col-span-4 lg:col-span-1`}>
              <span className={`${colors.accentText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>MPG</span>
              <div className="flex flex-col items-center">
                <span className={`font-black oswald text-3xl ${colors.accentText}`}>{seasonStats.mpg}</span>
                <span className={`text-xs ${colors.mutedText} font-bold mt-1`}>{seasonStats.gamesPlayed} GP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Season Tabs */}
        <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b-2 ${colors.cardBorder}`}>
          {seasons.map(s => (
            <button
              key={s}
              onClick={() => { setActiveSeason(s); setFilterComp('All'); }}
              className={`px-6 py-3 rounded-t-xl text-base font-black whitespace-nowrap transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${
                activeSeason === s
                  ? `${colors.cardBg} ${colors.primaryText} border-b-4 ${colors.tabActive}`
                  : `${colors.mutedText} hover:${colors.secondaryText} hover:${colors.cardBg}`
              }`}
            >
              <span>{s === 'All seasons' ? '🏀 ALL SEASONS' : `SEASON ${s}`}</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${activeSeason === s ? colors.tabBadgeActive : `${colors.cardBg} ${colors.mutedText}`}`}>
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
            className={`w-full ${colors.cardBg} ${colors.inputBorder} border-2 rounded-2xl pl-12 pr-4 py-4 text-base ${colors.primaryText} focus:ring-2 ${colors.inputFocus} outline-none transition-all placeholder:${colors.mutedText}`}
          />
          <svg className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${colors.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.mutedText} hover:${colors.primaryText} transition-all`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 gap-6">
          <div className="flex items-center gap-3">
            <h2 className={`text-4xl font-black oswald ${colors.primaryText} tracking-tight`}>
              {activeSeason === 'All seasons' ? 'ALL GAMES' : `SEASON ${activeSeason}`}
            </h2>
            <span className={`${colors.mutedText} text-base font-black`}>
              ({filteredGamesForSeason.length} {filteredGamesForSeason.length === 1 ? 'game' : 'games'})
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
              {/* View Mode Toggle */}
              <div className={`flex items-center gap-2 ${colors.cardBg} p-1.5 rounded-xl border ${colors.cardBorder}`}>
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? `${colors.accent} ${colors.buttonText}` : `${colors.mutedText} hover:${colors.primaryText}`}`}
                  title="Gallery View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? `${colors.accent} ${colors.buttonText}` : `${colors.mutedText} hover:${colors.primaryText}`}`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button
                  onClick={() => setShowBest(!showBest)}
                  className={`text-xs font-black transition-all px-6 py-2.5 rounded-full border-2 ${showBest ? `${colors.accentBg} ${colors.accentBorder} ${colors.accentText} shadow-lg ${colors.shadowColor}` : `${colors.cardBorder} ${colors.mutedText} hover:${colors.secondaryText}`}`}
              >
                  TOP 10 BEST
              </button>
              <div className={`flex items-center gap-3 ${colors.cardBg} px-4 py-2 rounded-xl border ${colors.cardBorder}`}>
                  <span className={`${colors.mutedText} font-black text-xs tracking-widest`}>SORT:</span>
                  <select
                      className={`bg-transparent border-none focus:ring-0 font-black text-xs uppercase ${colors.secondaryText} p-0 cursor-pointer hover:${colors.primaryText}`}
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortField)}
                  >
                      <option value="date" className={colors.cardBg}>Date</option>
                      <option value="points" className={colors.cardBg}>Points</option>
                      <option value="indexRating" className={colors.cardBg}>Index</option>
                      <option value="rebounds" className={colors.cardBg}>Rebounds</option>
                      <option value="assists" className={colors.cardBg}>Assists</option>
                      <option value="minutes" className={colors.cardBg}>Minutes</option>
                  </select>
              </div>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {compsInActiveSeason.map(c => (
          <button
              key={c}
              onClick={() => setFilterComp(c)}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border-2 transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${
              filterComp === c ? `${colors.accent} ${colors.accentBorder} ${colors.buttonText} shadow-xl ${colors.shadowColor}` : `${colors.cardBg} ${colors.cardBorder} ${colors.mutedText} hover:${colors.secondaryText}`
              }`}
          >
              <span>{c}</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${filterComp === c ? 'bg-black/20' : colors.statsBg}`}>
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
              className={`${colors.cardBg} rounded-3xl overflow-hidden border-2 ${colors.cardBorder} shadow-2xl group ${colors.cardHoverBorder} transition-all duration-500 ${game.isDnp ? 'opacity-60' : ''}`}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Competition Logo */}
                    <div className="flex items-center gap-2">
                      <img
                        src={getCompetitionLogo(game.competition)}
                        alt={game.competition}
                        className="w-6 h-6 object-contain flex-shrink-0"
                      />
                      <span className={`text-xs font-black ${colors.statsBg} ${colors.secondaryText} px-3 py-1.5 rounded-xl uppercase tracking-widest group-hover:opacity-80 transition-all`}>{game.competition}</span>
                    </div>
                    <span className={`text-sm ${colors.mutedText} font-black uppercase tracking-tighter`}>{game.date}</span>
                    {game.isOvertime && <span className="text-xs font-black bg-amber-900/40 text-amber-400 px-3 py-1.5 rounded-xl uppercase tracking-widest">OT</span>}
                  </div>
                  {game.isDnp && <span className="text-xs font-black bg-red-900/40 text-red-400 px-4 py-2 rounded-xl uppercase tracking-widest">DNP</span>}
                </div>

                <div className="flex items-center gap-5">
                  {/* Opponent Logo - bigger, no background */}
                  <img
                    src={getTeamLogo(game.opponent)}
                    alt={game.opponent}
                    className="w-20 h-20 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-black text-4xl ${colors.primaryText} truncate oswald tracking-tight transition-colors`}>
                      {game.isHome ? 'vs ' : '@ '}{game.opponent}
                    </h4>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`text-3xl font-black oswald ${game.result === 'W' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {game.result} {game.finalScore}
                      </span>
                      <span className={`${colors.mutedText} text-sm font-black tracking-widest`}>({game.seasonRecord})</span>
                    </div>
                  </div>
                </div>

                {game.isGameWinner && (
                  <div className={`mt-5 flex items-center justify-center py-3 ${colors.accentBg} border ${colors.accentBorder} rounded-xl`}>
                    <span className={`text-xs font-black ${colors.accentText} uppercase tracking-[0.3em] animate-pulse`}>GAME WINNER 🎯</span>
                  </div>
                )}

                {game.stats.fouls === 5 && (
                  <div className={`mt-5 flex items-center justify-center py-3 bg-red-900/40 border border-red-500/30 rounded-xl`}>
                    <span className={`text-xs font-black text-red-400 uppercase tracking-[0.3em]`}>FOULED OUT 🚫</span>
                  </div>
                )}

                {game.isDnp && (
                  <div className={`mt-6 p-5 ${colors.statsBg} rounded-2xl border ${colors.cardBorder}`}>
                    <p className={`text-sm font-black ${colors.mutedText} uppercase tracking-widest mb-2`}>DNP REASON</p>
                    <p className={`text-base font-bold ${colors.secondaryText} italic`}>"{game.dnpReason || 'No details provided'}"</p>
                  </div>
                )}
              </div>

              <div className={`${colors.statsBg} px-8 py-6 border-t-2 ${colors.cardBorder} transition-all`}>
                {!game.isDnp ? (
                  <>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                      {/* Minutes - highlighted */}
                      <div className={`flex flex-col items-center justify-center p-3 ${colors.accentBg} rounded-xl border-2 ${colors.accentBorder}`}>
                        <span className={`${colors.accentText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>MIN</span>
                        <span className={`font-black oswald text-2xl md:text-3xl ${colors.accentText}`}>{game.stats.minutes}</span>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-3 ${colors.cardBg} rounded-xl border ${colors.cardBorder}`}>
                        <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>PTS</span>
                        <span className={`font-black oswald text-2xl md:text-3xl ${colors.primaryText}`}>{game.stats.points}</span>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-3 ${colors.cardBg} rounded-xl border ${colors.cardBorder}`}>
                        <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>REB</span>
                        <span className={`font-black oswald text-2xl md:text-3xl ${colors.primaryText}`}>{game.stats.rebounds}</span>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-3 ${colors.cardBg} rounded-xl border ${colors.cardBorder}`}>
                        <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>AST</span>
                        <span className={`font-black oswald text-2xl md:text-3xl ${colors.primaryText}`}>{game.stats.assists}</span>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-3 ${colors.accentBg} rounded-xl border-2 ${colors.accentBorder} col-span-2 md:col-span-1`}>
                        <span className={`${colors.accentText} font-black uppercase text-[10px] tracking-[0.2em] mb-1.5`}>PIR</span>
                        <span className={`font-black oswald text-2xl md:text-3xl ${colors.accentText}`}>{game.stats.indexRating}</span>
                      </div>
                    </div>

                    {/* Expand Stats Button */}
                    <button
                      onClick={() => toggleExpanded(game.id)}
                      className={`w-full mt-4 py-3 flex items-center justify-center gap-2 ${colors.mutedText} hover:${colors.accentText} transition-all rounded-xl hover:${colors.cardBg}`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">
                        {expandedGameId === game.id ? 'Hide Details' : 'Show Full Stats'}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${expandedGameId === game.id ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Stats Section */}
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        expandedGameId === game.id ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className={`${colors.cardBg} rounded-2xl p-5 border ${colors.cardBorder} space-y-5`}>
                        {/* Shooting Stats */}
                        <div>
                          <h5 className={`text-xs font-black ${colors.accentText} uppercase tracking-widest mb-3`}>Shooting</h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div className={`${colors.statsBg} rounded-xl p-3 text-center border ${colors.cardBorder}`}>
                              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-wider block mb-1`}>2PT</span>
                              <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.twoPtMade}/{game.stats.twoPtAtt}</span>
                              <span className={`${colors.mutedText} text-xs font-bold block mt-0.5`}>
                                {game.stats.twoPtAtt > 0 ? ((game.stats.twoPtMade / game.stats.twoPtAtt) * 100).toFixed(0) : 0}%
                              </span>
                            </div>
                            <div className={`${colors.statsBg} rounded-xl p-3 text-center border ${colors.cardBorder}`}>
                              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-wider block mb-1`}>3PT</span>
                              <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.threePtMade}/{game.stats.threePtAtt}</span>
                              <span className={`${colors.mutedText} text-xs font-bold block mt-0.5`}>
                                {game.stats.threePtAtt > 0 ? ((game.stats.threePtMade / game.stats.threePtAtt) * 100).toFixed(0) : 0}%
                              </span>
                            </div>
                            <div className={`${colors.statsBg} rounded-xl p-3 text-center border ${colors.cardBorder}`}>
                              <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-wider block mb-1`}>FT</span>
                              <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.ftMade}/{game.stats.ftAtt}</span>
                              <span className={`${colors.mutedText} text-xs font-bold block mt-0.5`}>
                                {game.stats.ftAtt > 0 ? ((game.stats.ftMade / game.stats.ftAtt) * 100).toFixed(0) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Other Stats */}
                        <div>
                          <h5 className={`text-xs font-black ${colors.secondaryText} uppercase tracking-widest mb-3`}>Other Stats</h5>
                          <div className="grid grid-cols-4 gap-2">
                            <div className={`${colors.statsBg} rounded-lg p-2 text-center border ${colors.cardBorder}`}>
                              <span className={`${colors.mutedText} font-black uppercase text-[9px] tracking-wider block`}>STL</span>
                              <span className={`font-black oswald text-lg ${colors.primaryText}`}>{game.stats.steals}</span>
                            </div>
                            <div className={`${colors.statsBg} rounded-lg p-2 text-center border ${colors.cardBorder}`}>
                              <span className={`${colors.mutedText} font-black uppercase text-[9px] tracking-wider block`}>BLK</span>
                              <span className={`font-black oswald text-lg ${colors.primaryText}`}>{game.stats.blocks}</span>
                            </div>
                            <div className={`${colors.statsBg} rounded-lg p-2 text-center border ${colors.cardBorder}`}>
                              <span className={`${colors.mutedText} font-black uppercase text-[9px] tracking-wider block`}>TO</span>
                              <span className={`font-black oswald text-lg ${colors.primaryText}`}>{game.stats.turnovers}</span>
                            </div>
                            <div className={`${colors.statsBg} rounded-lg p-2 text-center border ${colors.cardBorder}`}>
                              <span className={`${colors.mutedText} font-black uppercase text-[9px] tracking-wider block`}>FOULS</span>
                              <span className={`font-black oswald text-lg ${colors.primaryText}`}>{game.stats.fouls}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {game.notes && (
                          <div className={`${colors.statsBg} rounded-xl p-4 border ${colors.cardBorder}`}>
                            <h5 className={`text-xs font-black ${colors.accentText} uppercase tracking-widest mb-2`}>Notes</h5>
                            <p className={`text-base ${colors.secondaryText} italic`}>"{game.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`flex items-center justify-center ${colors.mutedText} font-black tracking-[0.4em] text-sm uppercase py-4`}>
                    NOT ACTIVE
                  </div>
                )}
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => onEdit(game)} className={`p-3 ${colors.mutedText} hover:${colors.primaryText} hover:${colors.cardBg} rounded-xl transition-all`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => onDelete(game.id)} className={`p-3 ${colors.mutedText} hover:text-red-500 hover:bg-red-900/10 rounded-xl transition-all`}>
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
            className={`${colors.cardBg} rounded-2xl border-2 ${colors.cardBorder} shadow-xl group ${colors.cardHoverBorder} transition-all duration-300 ${game.isDnp ? 'opacity-60' : ''}`}
          >
            <div className="p-5 flex items-center gap-4">
              {/* Left: Date & Competition with logo */}
              <div className="flex flex-col items-start gap-1.5 min-w-[130px]">
                <div className="flex items-center gap-2">
                  <img
                    src={getCompetitionLogo(game.competition)}
                    alt={game.competition}
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  <span className={`text-xs font-black ${colors.statsBg} ${colors.secondaryText} px-2 py-1 rounded-lg uppercase tracking-widest group-hover:opacity-80 transition-all`}>{game.competition}</span>
                </div>
                <span className={`text-xs ${colors.mutedText} font-black uppercase tracking-tighter`}>{game.date}</span>
              </div>

              {/* Opponent Logo - bigger, no background */}
              <img
                src={getTeamLogo(game.opponent)}
                alt={game.opponent}
                className="w-14 h-14 object-contain flex-shrink-0"
              />

              {/* Center: Opponent & Score */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-black text-xl ${colors.primaryText} truncate oswald tracking-tight transition-colors`}>
                    {game.isHome ? 'vs ' : '@ '}{game.opponent}
                  </h4>
                  {game.isDnp && <span className="text-xs font-black bg-red-900/40 text-red-400 px-2 py-1 rounded-lg uppercase tracking-widest">DNP</span>}
                  {game.isGameWinner && <span className={`text-xs font-black ${colors.accentBg} ${colors.accentText} px-2 py-1 rounded-lg uppercase tracking-widest animate-pulse`}>🎯 WINNER</span>}
                  {game.isOvertime && <span className="text-xs font-black bg-amber-900/40 text-amber-400 px-2 py-1 rounded-lg uppercase tracking-widest">OT</span>}
                  {game.stats.fouls === 5 && <span className="text-xs font-black bg-red-900/40 text-red-400 px-2 py-1 rounded-lg uppercase tracking-widest">🚫 FOULED OUT</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-black oswald ${game.result === 'W' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {game.result} {game.finalScore}
                  </span>
                  <span className={`${colors.mutedText} text-xs font-black tracking-widest`}>({game.seasonRecord})</span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-4">
                {!game.isDnp ? (
                  <>
                    {/* Minutes - highlighted */}
                    <div className={`text-center px-2 py-1 ${colors.accentBg} rounded-lg border ${colors.accentBorder}`}>
                      <span className={`${colors.accentText} font-black uppercase text-[10px] tracking-[0.2em] block mb-0.5`}>MIN</span>
                      <span className={`font-black oswald text-xl ${colors.accentText}`}>{game.stats.minutes}</span>
                    </div>
                    <div className="text-center">
                      <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] block mb-0.5`}>PTS</span>
                      <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.points}</span>
                    </div>
                    <div className="text-center">
                      <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] block mb-0.5`}>REB</span>
                      <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.rebounds}</span>
                    </div>
                    <div className="text-center">
                      <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-[0.2em] block mb-0.5`}>AST</span>
                      <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.assists}</span>
                    </div>
                  </>
                ) : (
                  <div className={`flex items-center ${colors.mutedText} font-black tracking-[0.3em] text-xs uppercase`}>
                    NOT ACTIVE
                  </div>
                )}
              </div>

              {/* PIR Index */}
              {!game.isDnp && (
                <div className={`${colors.statsBg} rounded-xl px-4 py-2.5 text-center min-w-[70px] border-2 ${colors.cardBorder} ${colors.cardHoverBorder} transition-all shadow-inner`}>
                  <p className={`text-[9px] ${colors.accentText} font-black uppercase tracking-[0.2em] leading-none mb-1`}>PIR</p>
                  <p className={`oswald text-2xl font-black ${colors.accentText} leading-none`}>{game.stats.indexRating}</p>
                </div>
              )}

              {/* Expand Button */}
              {!game.isDnp && (
                <button
                  onClick={() => toggleExpanded(game.id)}
                  className={`p-2.5 ${colors.mutedText} hover:${colors.accentText} hover:${colors.cardBg} rounded-xl transition-all`}
                  title="Show full stats"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${expandedGameId === game.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {/* Actions */}
              <div className="flex gap-1.5">
                <button onClick={() => onEdit(game)} className={`p-2.5 ${colors.mutedText} hover:${colors.primaryText} hover:${colors.cardBg} rounded-xl transition-all`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(game.id)} className={`p-2.5 ${colors.mutedText} hover:text-red-500 hover:bg-red-900/10 rounded-xl transition-all`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Stats Section for List View */}
            {!game.isDnp && (
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedGameId === game.id ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5">
                  <div className={`${colors.statsBg} rounded-2xl p-5 border ${colors.cardBorder} space-y-4`}>
                    {/* Shooting Stats */}
                    <div>
                      <h5 className={`text-xs font-black ${colors.accentText} uppercase tracking-widest mb-3`}>Shooting</h5>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        <div className={`${colors.cardBg} rounded-xl p-3 text-center border ${colors.cardBorder}`}>
                          <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-wider block mb-1`}>2PT</span>
                          <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.twoPtMade}/{game.stats.twoPtAtt}</span>
                          <span className={`${colors.mutedText} text-xs font-bold block mt-0.5`}>
                            {game.stats.twoPtAtt > 0 ? ((game.stats.twoPtMade / game.stats.twoPtAtt) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                        <div className={`${colors.cardBg} rounded-xl p-3 text-center border ${colors.cardBorder}`}>
                          <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-wider block mb-1`}>3PT</span>
                          <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.threePtMade}/{game.stats.threePtAtt}</span>
                          <span className={`${colors.mutedText} text-xs font-bold block mt-0.5`}>
                            {game.stats.threePtAtt > 0 ? ((game.stats.threePtMade / game.stats.threePtAtt) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                        <div className={`${colors.cardBg} rounded-xl p-3 text-center border ${colors.cardBorder}`}>
                          <span className={`${colors.mutedText} font-black uppercase text-[10px] tracking-wider block mb-1`}>FT</span>
                          <span className={`font-black oswald text-xl ${colors.primaryText}`}>{game.stats.ftMade}/{game.stats.ftAtt}</span>
                          <span className={`${colors.mutedText} text-xs font-bold block mt-0.5`}>
                            {game.stats.ftAtt > 0 ? ((game.stats.ftMade / game.stats.ftAtt) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                        <div className={`${colors.cardBg} rounded-lg p-2.5 text-center border ${colors.cardBorder}`}>
                          <span className={`${colors.mutedText} font-black uppercase text-[9px] tracking-wider block`}>STL</span>
                          <span className={`font-black oswald text-lg ${colors.primaryText}`}>{game.stats.steals}</span>
                        </div>
                        <div className={`${colors.cardBg} rounded-lg p-2.5 text-center border ${colors.cardBorder}`}>
                          <span className={`${colors.mutedText} font-black uppercase text-[9px] tracking-wider block`}>BLK</span>
                          <span className={`font-black oswald text-lg ${colors.primaryText}`}>{game.stats.blocks}</span>
                        </div>
                        <div className={`${colors.cardBg} rounded-lg p-2.5 text-center border ${colors.cardBorder}`}>
                          <span className={`${colors.mutedText} font-black uppercase text-[9px] tracking-wider block`}>TO</span>
                          <span className={`font-black oswald text-lg ${colors.primaryText}`}>{game.stats.turnovers}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {game.notes && (
                      <div className={`${colors.cardBg} rounded-xl p-4 border ${colors.cardBorder}`}>
                        <h5 className={`text-xs font-black ${colors.accentText} uppercase tracking-widest mb-2`}>Notes</h5>
                        <p className={`text-base ${colors.secondaryText} italic`}>"{game.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
};
