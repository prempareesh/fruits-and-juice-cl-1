import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Detect platform without hard-depending on react-native for web compatibility
const isWeb = typeof window !== 'undefined';

// Custom storage adapter with web fallback for cross-platform support
const SharedStorageAdapter = {
  getItem: async (key: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    // Native (React Native / Expo)
    try {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    } catch (e) {}
  },
  removeItem: async (key: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch (e) {}
  },
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: SharedStorageAdapter as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

/**
 * Unified safe query helper with retries and exponential backoff.
 */
export const safeQuery = async <T = any>(
  queryFn: () => PromiseLike<any>,
  retries = 3,
  delay = 500
): Promise<{ data: T | null; error: any }> => {
  let lastError;
  const client = getSupabase();
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await queryFn();
      if (result.error) throw result.error;
      return result;
    } catch (err: any) {
      lastError = err;
      const isNetworkError = err.message?.toLowerCase().includes('network') || 
                            err.message?.toLowerCase().includes('fetch');
      
      if (!isNetworkError || i === retries - 1) break;
      
      const backoff = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  return { data: null, error: lastError };
};

export const getUserRole = async (userId: string): Promise<string> => {
  const { data: profile } = await getSupabase()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role || 'customer';
};
