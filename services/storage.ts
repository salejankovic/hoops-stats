
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GameEntry, StorageConfig, SyncStatus, UserProfile, AppSettings } from '../types';

const LOCAL_KEY = 'hoops_stats_data';
const CONFIG_KEY = 'hoops_stats_config';
const SYNC_KEY = 'hoops_stats_last_sync';
const APP_SETTINGS_KEY = 'hoops_app_settings';

// Default app settings
const getDefaultAppSettings = (): AppSettings => ({
  teams: [],
  competitions: []
});

type Listener<T> = (data: T) => void;

class StorageService {
  private config: StorageConfig = { type: 'local' };
  private client: SupabaseClient | null = null;
  private currentUser: UserProfile | null = null;
  private lastSync: string | null = localStorage.getItem(SYNC_KEY);

  private statusListeners: Listener<SyncStatus>[] = [];
  private userListeners: Listener<UserProfile | null>[] = [];
  private configListeners: Listener<StorageConfig>[] = [];
  private syncListeners: Listener<string | null>[] = [];

  constructor() {
    // Initialize Supabase client with environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      this.client = createClient(supabaseUrl, supabaseAnonKey);
      this.config = {
        type: 'supabase',
        supabaseConfig: {
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
        },
      };

      // Check if user is already logged in
      this.client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          this.currentUser = {
            uid: session.user.id,
            email: session.user.email || null,
          };
          this.notifyUserListeners(this.currentUser);
          this.notifyStatusListeners('synced');
        }
      });

      // Listen to auth state changes
      this.client.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          this.currentUser = {
            uid: session.user.id,
            email: session.user.email || null,
          };
          this.notifyUserListeners(this.currentUser);
          this.notifyStatusListeners('synced');
        } else {
          this.currentUser = null;
          this.notifyUserListeners(null);
          this.notifyStatusListeners('offline');
        }
      });
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

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  async saveConfig(config: StorageConfig) {
    this.config = config;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    this.notifyConfigListeners(this.config);
  }

  async signIn(email: string, password: string) {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      this.currentUser = {
        uid: data.user.id,
        email: data.user.email || null,
      };
      this.notifyUserListeners(this.currentUser);
      this.notifyStatusListeners('synced');
      this.updateSyncTime();
      return { user: this.currentUser };
    }

    throw new Error('Sign in failed');
  }

  async signOut() {
    if (this.client) {
      await this.client.auth.signOut();
    }
    this.currentUser = null;
    this.notifyUserListeners(null);
    this.notifyStatusListeners('offline');
    this.lastSync = null;
    localStorage.removeItem(SYNC_KEY);
    this.notifySyncListeners(null);
  }

  async loadGames(): Promise<GameEntry[]> {
    if (!this.client || !this.currentUser) {
      // Fallback to localStorage if not connected
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse local games", e);
        }
      }
      return [];
    }

    try {
      this.notifyStatusListeners('syncing');

      const { data, error } = await this.client
        .from('games')
        .select('*')
        .eq('user_id', this.currentUser.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const games: GameEntry[] = data.map((row: any) => ({
        ...row.payload,
        id: row.id,
      }));

      // Also save to localStorage as backup
      localStorage.setItem(LOCAL_KEY, JSON.stringify(games));

      this.notifyStatusListeners('synced');
      this.updateSyncTime();
      return games;
    } catch (error) {
      console.error('Error loading games from Supabase:', error);
      this.notifyStatusListeners('error');

      // Fallback to localStorage
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse local games", e);
        }
      }
      return [];
    }
  }

  async saveGames(games: GameEntry[]): Promise<void> {
    // Always save to localStorage first
    localStorage.setItem(LOCAL_KEY, JSON.stringify(games));

    if (!this.client || !this.currentUser) {
      this.notifyStatusListeners('offline');
      return;
    }

    try {
      this.notifyStatusListeners('syncing');

      // Delete all existing games for this user
      await this.client
        .from('games')
        .delete()
        .eq('user_id', this.currentUser.uid);

      // Insert all games
      const rows = games.map(game => ({
        id: game.id,
        user_id: this.currentUser!.uid,
        payload: game,
      }));

      const { error } = await this.client
        .from('games')
        .insert(rows);

      if (error) throw error;

      this.notifyStatusListeners('synced');
      this.updateSyncTime();
    } catch (error) {
      console.error('Error saving games to Supabase:', error);
      this.notifyStatusListeners('error');
    }
  }

  async deleteGame(id: string): Promise<void> {
    // Delete from localStorage
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      const games = JSON.parse(saved) as GameEntry[];
      const filtered = games.filter(g => g.id !== id);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
    }

    if (!this.client || !this.currentUser) {
      this.notifyStatusListeners('offline');
      return;
    }

    try {
      this.notifyStatusListeners('syncing');

      const { error } = await this.client
        .from('games')
        .delete()
        .eq('id', id)
        .eq('user_id', this.currentUser.uid);

      if (error) throw error;

      this.notifyStatusListeners('synced');
      this.updateSyncTime();
    } catch (error) {
      console.error('Error deleting game from Supabase:', error);
      this.notifyStatusListeners('error');
    }
  }

  // Load app settings (teams/competitions with logos) from Supabase
  async loadAppSettings(): Promise<AppSettings> {
    // NOTE: We don't use localStorage for app settings because base64 logos are too large
    // and cause QuotaExceededError. Settings are stored only in Supabase.

    console.log('[AppSettings] Loading - client exists:', !!this.client, 'user exists:', !!this.currentUser);

    // Wait for session to be initialized if Supabase client exists
    if (this.client && !this.currentUser) {
      console.log('[AppSettings] Fetching session...');
      try {
        const { data: { session } } = await this.client.auth.getSession();
        console.log('[AppSettings] Session fetched:', !!session, 'user:', session?.user?.email);
        if (session?.user) {
          this.currentUser = {
            uid: session.user.id,
            email: session.user.email || null,
          };
          this.notifyUserListeners(this.currentUser);
          console.log('[AppSettings] User set:', this.currentUser.email);
        }
      } catch (error) {
        console.error('[AppSettings] Error getting session:', error);
      }
    }

    // If not connected to Supabase or no user, return default settings
    if (!this.client || !this.currentUser) {
      console.log('[AppSettings] No Supabase client or user, returning default settings');
      return getDefaultAppSettings();
    }

    try {
      console.log('[AppSettings] Querying database for user:', this.currentUser.email);
      const { data, error } = await this.client
        .from('app_settings')
        .select('*')
        .eq('user_id', this.currentUser.uid)
        .single();

      if (error) {
        // If no settings exist yet, that's OK - return default
        if (error.code === 'PGRST116') {
          console.log('[AppSettings] No settings found in database, returning defaults');
          return getDefaultAppSettings();
        }
        console.error('[AppSettings] Error loading from Supabase:', error);
        throw error;
      }

      if (data?.settings) {
        const settings = data.settings as AppSettings;
        const teamsWithLogos = settings.teams.filter(t => !!t.logo).length;
        const compsWithLogos = settings.competitions.filter(c => !!c.logo).length;
        console.log('[AppSettings] Loaded from DB:', settings.teams.length, 'teams,', teamsWithLogos, 'with logos');
        console.log('[AppSettings] Loaded from DB:', settings.competitions.length, 'comps,', compsWithLogos, 'with logos');
        return settings;
      }

      console.log('[AppSettings] No settings data in response, returning defaults');
      return getDefaultAppSettings();
    } catch (error) {
      console.error('Error loading app settings from Supabase:', error);
      return getDefaultAppSettings();
    }
  }

  // Save app settings (teams/competitions with logos) to Supabase
  async saveAppSettings(settings: AppSettings): Promise<void> {
    // NOTE: We don't cache to localStorage because base64 logos are too large
    // and cause QuotaExceededError. Settings are stored only in Supabase.

    // Wait for session to be initialized if Supabase client exists
    if (this.client && !this.currentUser) {
      try {
        const { data: { session } } = await this.client.auth.getSession();
        if (session?.user) {
          this.currentUser = {
            uid: session.user.id,
            email: session.user.email || null,
          };
          this.notifyUserListeners(this.currentUser);
        }
      } catch (error) {
        console.error('[AppSettings] Error getting session:', error);
      }
    }

    if (!this.client || !this.currentUser) {
      console.error('[AppSettings] Cannot save - no Supabase client or user');
      return;
    }

    // SAFEGUARD: Check current database state before saving
    // Never overwrite if we would lose logos
    const newTeamsWithLogos = settings.teams.filter(t => !!t.logo).length;
    const newCompsWithLogos = settings.competitions.filter(c => !!c.logo).length;

    try {
      const { data: currentData } = await this.client
        .from('app_settings')
        .select('settings')
        .eq('user_id', this.currentUser.uid)
        .single();

      if (currentData?.settings) {
        const currentSettings = currentData.settings as AppSettings;
        const currentTeamsWithLogos = currentSettings.teams.filter(t => !!t.logo).length;
        const currentCompsWithLogos = currentSettings.competitions.filter(c => !!c.logo).length;

        console.log('[AppSettings] Save check - DB has:', currentTeamsWithLogos, 'team logos,', currentCompsWithLogos, 'comp logos');
        console.log('[AppSettings] Save check - New has:', newTeamsWithLogos, 'team logos,', newCompsWithLogos, 'comp logos');

        // If we would lose logos, refuse to save (unless we're adding more logos)
        if (currentTeamsWithLogos > 0 && newTeamsWithLogos < currentTeamsWithLogos) {
          console.error('[AppSettings] BLOCKED: Would lose', currentTeamsWithLogos - newTeamsWithLogos, 'team logos. Refusing to save.');
          return;
        }
        if (currentCompsWithLogos > 0 && newCompsWithLogos < currentCompsWithLogos) {
          console.error('[AppSettings] BLOCKED: Would lose', currentCompsWithLogos - newCompsWithLogos, 'competition logos. Refusing to save.');
          return;
        }
      }

      const { error } = await this.client
        .from('app_settings')
        .upsert({
          user_id: this.currentUser.uid,
          settings: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[AppSettings] Error saving to Supabase:', error);
        throw error;
      }

      console.log('[AppSettings] Successfully saved to database');
      this.updateSyncTime();
    } catch (error) {
      console.error('Error saving app settings to Supabase:', error);
    }
  }
}

export const storageService = new StorageService();
