
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

// Team configuration with logo support
export interface TeamConfig {
  id: string;
  name: string;
  logo?: string; // Base64 encoded image or URL
  shortName?: string;
}

// Competition configuration with logo support
export interface CompetitionConfig {
  id: string;
  name: string;
  logo?: string; // Base64 encoded image or URL
  shortName?: string;
}

// App settings for teams and competitions
export interface AppSettings {
  teams: TeamConfig[];
  competitions: CompetitionConfig[];
}
