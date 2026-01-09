
export type CompetitionType = string;

export interface GameStats {
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  fouls: number;
  foulsDrawn: number;
  twoPtMade: number;
  twoPtAtt: number;
  threePtMade: number;
  threePtAtt: number;
  ftMade: number;
  ftAtt: number;
  indexRating: number;
}

export interface GameEntry {
  id: string;
  date: string;
  competition: CompetitionType;
  opponent: string;
  finalScore: string;
  result: 'W' | 'L';
  seasonRecord: string;
  stats: GameStats;
  season: string;
  team: 'Partizan' | 'Reprezentacija';
  isDnp?: boolean;
  dnpReason?: string;
  isGameWinner?: boolean;
  isHome: boolean;
  isOvertime?: boolean;
  notes?: string;
}

export type SortField = 'date' | 'points' | 'indexRating' | 'rebounds' | 'assists' | 'minutes';

export interface StorageConfig {
  type: 'local' | 'supabase';
  supabaseConfig?: {
    url: string;
    anonKey: string;
  };
}

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error' | 'unauthorized';

export interface AiInsight {
  title: string;
  content: string;
  type: 'strength' | 'weakness' | 'trend' | 'advice';
}

export interface UserProfile {
  uid: string;
  email: string | null;
}
