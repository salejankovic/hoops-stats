
import React, { useMemo, useState, useEffect } from 'react';
import { GameEntry, AiInsight } from '../types';
import { aiService } from '../services/ai';

interface StatsDashboardProps {
  games: GameEntry[];
}

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = ({ label, value, sub, color = "text-white" }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 hover:border-orange-500/30 transition-all shadow-lg group">
    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5">{label}</p>
    <div className="flex items-baseline gap-1.5">
      <p className={`text-3xl font-bold oswald ${color} group-hover:scale-105 transition-transform origin-left`}>{value}</p>
      {sub && <span className="text-slate-500 text-[10px] font-black uppercase">{sub}</span>}
    </div>
  </div>
);

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ games }) => {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const stats = useMemo(() => {
    const activeGames = games.filter(g => !g.isDnp);
    if (activeGames.length === 0 && games.length === 0) return null;

    const totals = activeGames.reduce((acc, game) => ({
      points: acc.points + game.stats.points,
      rebounds: acc.rebounds + game.stats.rebounds,
      assists: acc.assists + game.stats.assists,
      steals: acc.steals + game.stats.steals,
      blocks: acc.blocks + game.stats.blocks,
      turnovers: acc.turnovers + game.stats.turnovers,
      index: acc.index + game.stats.indexRating,
      wins: acc.wins + (game.result === 'W' ? 1 : 0),
      twoPM: acc.twoPM + game.stats.twoPtMade,
      twoPA: acc.twoPA + game.stats.twoPtAtt,
      threePM: acc.threePM + game.stats.threePtMade,
      threePA: acc.threePA + game.stats.threePtAtt,
      ftM: acc.ftM + game.stats.ftMade,
      ftA: acc.ftA + game.stats.ftAtt,
    }), {
      points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, 
      turnovers: 0, index: 0, wins: 0, twoPM: 0, twoPA: 0, 
      threePM: 0, threePA: 0, ftM: 0, ftA: 0
    });

    const totalWins = games.reduce((acc, g) => acc + (g.result === 'W' ? 1 : 0), 0);
    const count = activeGames.length;
    const calcPct = (m: number, a: number) => a === 0 ? 0 : Math.round((m / a) * 100);

    return {
      avgPoints: count === 0 ? "0.0" : (totals.points / count).toFixed(1),
      avgRebounds: count === 0 ? "0.0" : (totals.rebounds / count).toFixed(1),
      avgAssists: count === 0 ? "0.0" : (totals.assists / count).toFixed(1),
      avgIndex: count === 0 ? "0.0" : (totals.index / count).toFixed(1),
      winRate: games.length === 0 ? "0" : ((totalWins / games.length) * 100).toFixed(0),
      twoPct: calcPct(totals.twoPM, totals.twoPA),
      threePct: calcPct(totals.threePM, totals.threePA),
      ftPct: calcPct(totals.ftM, totals.ftA),
      totals
    };
  }, [games]);

  const generateInsights = async () => {
    if (games.length < 2) return;
    setLoadingAi(true);
    const result = await aiService.analyzePerformance(games);
    setInsights(result);
    setLoadingAi(false);
  };

  useEffect(() => {
    if (games.length >= 3 && insights.length === 0) {
      generateInsights();
    }
  }, [games.length]);

  if (!stats) return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-600">
      <div className="w-24 h-24 mb-6 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-800 animate-pulse">
        <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="font-black tracking-[0.3em] uppercase text-xs">NO PERFORMANCE DATA</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Points / GM" value={stats.avgPoints} sub="pts" color="text-orange-500" />
        <StatCard label="Boards / GM" value={stats.avgRebounds} sub="reb" />
        <StatCard label="Dimes / GM" value={stats.avgAssists} sub="ast" />
        <StatCard label="PIR / GM" value={stats.avgIndex} sub="index" color="text-indigo-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] rounded-full"></div>
            <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.3em] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-orange-600"></span>
              SHOOTING SPLITS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {[
                { label: '2-Point FG', val: stats.twoPct, color: 'bg-orange-500', shadow: 'shadow-orange-500/20', made: stats.totals.twoPM, att: stats.totals.twoPA },
                { label: '3-Point FG', val: stats.threePct, color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20', made: stats.totals.threePM, att: stats.totals.threePA },
                { label: 'Free Throws', val: stats.ftPct, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20', made: stats.totals.ftM, att: stats.totals.ftA },
              ].map((split) => (
                <div key={split.label} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{split.label}</span>
                    <span className="text-2xl font-bold oswald text-white">{split.val}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className={`h-full ${split.color} rounded-full transition-all duration-1000 ${split.shadow} shadow-lg`} style={{ width: `${split.val}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{split.made} / {split.att} FG</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-[2px] bg-indigo-500"></span>
                AI SCOUTING REPORT
              </h3>
              <button 
                onClick={generateInsights}
                disabled={loadingAi || games.length < 3}
                className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all group"
              >
                <svg className={`w-4 h-4 text-indigo-400 ${loadingAi ? 'animate-spin' : 'group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {loadingAi ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>)}
              </div>
            ) : insights.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border-2 transition-all ${
                    insight.type === 'strength' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    insight.type === 'weakness' ? 'bg-red-500/5 border-red-500/20' :
                    insight.type === 'trend' ? 'bg-indigo-500/5 border-indigo-500/20' :
                    'bg-orange-500/5 border-orange-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${
                          insight.type === 'strength' ? 'bg-emerald-500' :
                          insight.type === 'weakness' ? 'bg-red-500' :
                          insight.type === 'trend' ? 'bg-indigo-500' :
                          'bg-orange-500'
                       }`} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{insight.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{insight.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Add more games to unlock AI analysis</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col justify-between h-full">
            <div className="space-y-8">
                <div className="flex items-center justify-between group">
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest group-hover:text-slate-300 transition-colors">WIN PERCENTAGE</span>
                    <span className="oswald text-4xl text-emerald-500 font-bold group-hover:scale-110 transition-transform">{stats.winRate}%</span>
                </div>
                <div className="flex items-center justify-between group">
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest group-hover:text-slate-300 transition-colors">GAMES PLAYED</span>
                    <span className="oswald text-4xl text-white font-bold group-hover:scale-110 transition-transform">{games.length}</span>
                </div>
                <div className="flex items-center justify-between group">
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest group-hover:text-slate-300 transition-colors">CLUTCH MOMENTS</span>
                    <span className="oswald text-4xl text-orange-500 font-bold flex items-center gap-2 group-hover:scale-110 transition-transform">
                      {games.filter(g => g.isGameWinner).length}
                      <span className="text-lg">🎯</span>
                    </span>
                </div>
            </div>
            
            <div className="mt-12 p-6 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">SEASON TRAJECTORY</p>
                <div className="flex items-end gap-1.5 h-20">
                    {games.slice(-10).map((g, i) => (
                        <div 
                          key={i} 
                          title={`${g.opponent}: ${g.stats.indexRating} PIR`}
                          className={`flex-1 rounded-t-sm transition-all hover:opacity-100 opacity-60 ${g.result === 'W' ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ height: `${Math.max(10, Math.min(100, (g.stats.indexRating / 40) * 100))}%` }}
                        />
                    ))}
                </div>
                <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-2 text-center">LAST 10 GAMES</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
