
import { GameEntry, GameStats } from '../types';

export const parseRawGameText = (text: string): Partial<GameEntry> | null => {
  try {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) return null;

    const line1 = lines[0];
    const parts = line1.split('-').map(p => p.trim());
    
    const date = parts[0];
    const competition = parts[1];
    const matchInfo = parts.slice(2).join(' - '); 
    
    const scoreMatch = matchInfo.match(/(\d+:\d+)/);
    const score = scoreMatch ? scoreMatch[0] : '';
    const recordMatch = matchInfo.match(/\((\d+-\d+)\)/);
    const record = recordMatch ? recordMatch[1] : '';
    
    const opponent = matchInfo.split(/\d+:\d+/)[0].trim();

    let result: 'W' | 'L' = 'W';
    if (score) {
      const [home, away] = score.split(':').map(Number);
      // Logic could be added here to detect W/L based on record or score
    }

    const line2 = lines[1];
    const minutesMatch = line2.match(/(\d+)min/);
    const pointsMatch = line2.match(/(\d+)pts/);
    const rebMatch = line2.match(/(\d+)reb/);
    const astMatch = line2.match(/(\d+)ast/);
    const toMatch = line2.match(/(\d+)to/);
    const stlMatch = line2.match(/(\d+)stl/);
    const blkMatch = line2.match(/(\d+)blk/);
    const flsMatch = line2.match(/(\d+)fls/);

    const line3 = lines[2];
    const twoPtMatch = line3.match(/(\d+)\/(\d+)dva/);
    const threePtMatch = line3.match(/(\d+)\/(\d+)tri/);
    const ftMatch = line3.match(/(\d+)\/(\d+)ft/);

    const line4 = lines[3] || '';
    const indexMatch = line4.match(/Index (\d+)/);

    // Fix: Corrected property assignment to use the existing ftMatch variable instead of non-existent ftMade variable
    const stats: GameStats = {
      minutes: minutesMatch ? parseInt(minutesMatch[1]) : 0,
      points: pointsMatch ? parseInt(pointsMatch[1]) : 0,
      rebounds: rebMatch ? parseInt(rebMatch[1]) : 0,
      assists: astMatch ? parseInt(astMatch[1]) : 0,
      turnovers: toMatch ? parseInt(toMatch[1]) : 0,
      steals: stlMatch ? parseInt(stlMatch[1]) : 0,
      blocks: blkMatch ? parseInt(blkMatch[1]) : 0,
      fouls: flsMatch ? parseInt(flsMatch[1]) : 0,
      twoPtMade: twoPtMatch ? parseInt(twoPtMatch[1]) : 0,
      twoPtAtt: twoPtMatch ? parseInt(twoPtMatch[2]) : 0,
      threePtMade: threePtMatch ? parseInt(threePtMatch[1]) : 0,
      threePtAtt: threePtMatch ? parseInt(threePtMatch[2]) : 0,
      ftMade: ftMatch ? parseInt(ftMatch[1]) : 0,
      ftAtt: ftMatch ? parseInt(ftMatch[2]) : 0,
      indexRating: indexMatch ? parseInt(indexMatch[1]) : 0,
    };

    return {
      date,
      competition,
      opponent,
      finalScore: score,
      seasonRecord: record,
      result,
      stats
    };
  } catch (e) {
    console.error("Parsing failed", e);
    return null;
  }
};

export const exportToJSON = (games: GameEntry[]) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(games, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `hoops_stats_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToCSV = (games: GameEntry[]) => {
  const headers = [
    'Date', 'Competition', 'Opponent', 'Score', 'Result', 'Record', 
    'Min', 'Pts', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'Fls', '2PM', '2PA', '3PM', '3PA', 'FTM', 'FTA', 'Index'
  ];
  const rows = games.map(g => [
    g.date, g.competition, g.opponent, g.finalScore, g.result, g.seasonRecord,
    g.stats.minutes, g.stats.points, g.stats.rebounds, g.stats.assists, 
    g.stats.turnovers, g.stats.steals, g.stats.blocks, g.stats.fouls,
    g.stats.twoPtMade, g.stats.twoPtAtt, g.stats.threePtMade, g.stats.threePtAtt,
    g.stats.ftMade, g.stats.ftAtt, g.stats.indexRating
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(r => r.join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `basketball_stats_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};