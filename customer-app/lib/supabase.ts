import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://scdtwgquzsqnlhqovxut.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_iOztVHha4OykToDX9WqsFw_Dr7NtFVx';

/**
 * Permanent Supabase Client Configuration
 * Uses AsyncStorage for stable persistence and auto-refresh for long-term sessions.
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Helper for type-safe queries (legacy support if needed)
export const safeQuery = async (queryFn: any, retries = 3) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await queryFn();
      if (!error) return { data, error: null };
      lastError = error;

      // If it's a network error (no response or timeout), retry. 
      // Otherwise (404, 401, etc), return immediately.
      const isNetworkError = error.message?.includes('fetch') || error.code === 'PGRST301';
      if (!isNetworkError) break;

      // Exponential backoff
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
    } catch (err) {
      lastError = err;
    }
  }
  return { data: null, error: lastError };
};
