
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

    // If not connected to Supabase or no user, return default settings
    if (!this.client || !this.currentUser) {
      console.log('[AppSettings] No Supabase client or user, returning default settings');
      return getDefaultAppSettings();
    }

    try {
      console.log('[AppSettings] Loading from Supabase for user:', this.currentUser.uid);
      const { data, error } = await this.client
        .from('app_settings')
        .select('*')
        .eq('user_id', this.currentUser.uid)
        .single();

      if (error) {
        // If no settings exist yet, that's OK - return default
        if (error.code === 'PGRST116') {
          console.log('[AppSettings] No settings in Supabase yet, returning default settings');
          return getDefaultAppSettings();
        }
        console.error('[AppSettings] Supabase error:', error);
        throw error;
      }

      if (data?.settings) {
        const settings = data.settings as AppSettings;
        console.log('[AppSettings] Loaded from Supabase:', settings.teams.length, 'teams,', settings.competitions.length, 'competitions');

        // Log detailed info about first few teams/competitions to see if logos are present
        if (settings.teams.length > 0) {
          const firstTeam = settings.teams[0];
          console.log('[AppSettings] First team example:', {
            name: firstTeam.name,
            hasLogo: !!firstTeam.logo,
            logoLength: firstTeam.logo?.length || 0,
            logoPreview: firstTeam.logo?.substring(0, 50) + '...'
          });
        }
        if (settings.competitions.length > 0) {
          const firstComp = settings.competitions[0];
          console.log('[AppSettings] First competition example:', {
            name: firstComp.name,
            hasLogo: !!firstComp.logo,
            logoLength: firstComp.logo?.length || 0,
            logoPreview: firstComp.logo?.substring(0, 50) + '...'
          });
        }

        // Count how many teams/competitions actually have logos
        const teamsWithLogos = settings.teams.filter(t => !!t.logo).length;
        const compsWithLogos = settings.competitions.filter(c => !!c.logo).length;
        console.log('[AppSettings] Teams with logos:', teamsWithLogos, '/', settings.teams.length);
        console.log('[AppSettings] Competitions with logos:', compsWithLogos, '/', settings.competitions.length);

        // Don't cache to localStorage - logos are too large
        return settings;
      }

      console.log('[AppSettings] No settings data, returning default');
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

    // Count how many have logos before saving
    const teamsWithLogos = settings.teams.filter(t => !!t.logo).length;
    const compsWithLogos = settings.competitions.filter(c => !!c.logo).length;
    console.log('[AppSettings] About to save - Teams with logos:', teamsWithLogos, '/', settings.teams.length);
    console.log('[AppSettings] About to save - Competitions with logos:', compsWithLogos, '/', settings.competitions.length);

    if (settings.teams.length > 0 && settings.teams[0].logo) {
      console.log('[AppSettings] First team logo preview:', settings.teams[0].name, 'logo length:', settings.teams[0].logo.length);
    }

    if (!this.client || !this.currentUser) {
      console.log('[AppSettings] No Supabase client or user, skipping cloud save');
      return;
    }

    try {
      console.log('[AppSettings] Saving to Supabase for user:', this.currentUser.uid);

      // Calculate approximate size of settings JSON
      const settingsJson = JSON.stringify(settings);
      console.log('[AppSettings] Settings JSON size:', (settingsJson.length / 1024).toFixed(2), 'KB');

      // Upsert the settings (insert or update)
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
        console.error('[AppSettings] Supabase save error:', error);
        throw error;
      }

      console.log('[AppSettings] Successfully saved to Supabase');
      this.updateSyncTime();
    } catch (error) {
      console.error('Error saving app settings to Supabase:', error);
    }
  }
}

export const storageService = new StorageService();
