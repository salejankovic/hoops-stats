
import { GameEntry, StorageConfig, SyncStatus, UserProfile } from '../types';

const LOCAL_KEY = 'hoops_stats_data';
const CONFIG_KEY = 'hoops_stats_config';
const SYNC_KEY = 'hoops_stats_last_sync';
const AUTH_KEY = 'hoops_stats_auth';

// Hardcoded credentials for single user
const VALID_USER = {
  email: 'jankovic1998@gmail.com',
  password: 'partiz4n'
};

type Listener<T> = (data: T) => void;

class StorageService {
  private config: StorageConfig = { type: 'local' };
  private currentUser: UserProfile | null = null;
  private lastSync: string | null = localStorage.getItem(SYNC_KEY);

  private statusListeners: Listener<SyncStatus>[] = [];
  private userListeners: Listener<UserProfile | null>[] = [];
  private configListeners: Listener<StorageConfig>[] = [];
  private syncListeners: Listener<string | null>[] = [];

  constructor() {
    // Check if user is already logged in
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth);
        if (auth.email === VALID_USER.email) {
          this.currentUser = { uid: 'single-user', email: auth.email };
        }
      } catch (e) {
        console.error("Failed to load auth", e);
      }
    }
  }


  onStatusChange(callback: Listener<SyncStatus>) {
    this.statusListeners.push(callback);
    return () => { this.statusListeners = this.statusListeners.filter(l => l !== callback); };
  }

  onUserChange(callback: Listener<UserProfile | null>) {
    this.userListeners.push(callback);
    if (this.currentUser) callback(this.currentUser);
    return () => { this.userListeners = this.userListeners.filter(l => l !== callback); };
  }

  onConfigChange(callback: Listener<StorageConfig>) {
    this.configListeners.push(callback);
    return () => { this.configListeners = this.configListeners.filter(l => l !== callback); };
  }

  onSyncChange(callback: Listener<string | null>) {
    this.syncListeners.push(callback);
    callback(this.lastSync);
    return () => { this.syncListeners = this.syncListeners.filter(l => l !== callback); };
  }

  private notifyStatusListeners(status: SyncStatus) { this.statusListeners.forEach(l => l(status)); }
  private notifyUserListeners(user: UserProfile | null) { this.userListeners.forEach(l => l(user)); }
  private notifyConfigListeners(config: StorageConfig) { this.configListeners.forEach(l => l(config)); }
  private notifySyncListeners(time: string | null) { this.syncListeners.forEach(l => l(time)); }

  private updateSyncTime() {
    this.lastSync = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem(SYNC_KEY, this.lastSync);
    this.notifySyncListeners(this.lastSync);
  }

  isInitialized(): boolean {
    return !!this.client;
  }

  getConfig(): StorageConfig {
    return this.config;
  }

  getLastSync(): string | null {
    return this.lastSync;
  }

  // Fix: Added missing getCurrentUser method required by App.tsx and SyncSettings.tsx
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  async saveConfig(config: StorageConfig) {
    this.config = config;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    this.notifyConfigListeners(this.config);
  }

  async signIn(email: string, pass: string) {
    if (email === VALID_USER.email && pass === VALID_USER.password) {
      this.currentUser = { uid: 'single-user', email: VALID_USER.email };
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: VALID_USER.email }));
      this.notifyUserListeners(this.currentUser);
      this.notifyStatusListeners('offline');
      return { user: this.currentUser };
    }
    throw new Error('Invalid credentials');
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_KEY);
    this.notifyUserListeners(null);
    this.notifyStatusListeners('offline');
    this.lastSync = null;
    localStorage.removeItem(SYNC_KEY);
    this.notifySyncListeners(null);
  }

  async loadGames(): Promise<GameEntry[]> {
    const saved = localStorage.getItem(LOCAL_KEY);
    let localGames: GameEntry[] = [];
    if (saved) {
      try {
        localGames = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local games", e);
      }
    }
    this.notifyStatusListeners('offline');
    return localGames;
  }

  async saveGames(games: GameEntry[]): Promise<void> {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(games));
    this.notifyStatusListeners('offline');
  }

  async deleteGame(id: string): Promise<void> {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      const games = JSON.parse(saved) as GameEntry[];
      const filtered = games.filter(g => g.id !== id);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
    }
  }
}

export const storageService = new StorageService();
