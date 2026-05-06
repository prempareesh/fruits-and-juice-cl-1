import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter with web fallback
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper to execute Supabase queries with exponential backoff retries
 * Essential for mobile apps on unstable networks.
 */
export const safeQuery = async <T = any>(queryFn: () => PromiseLike<any>, retries = 3, delay = 500): Promise<{ data: T | null; error: any }> => {
  let lastError;
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

/**
 * Health check to verify connection to Supabase
 */
export const checkConnection = async () => {
  try {
    const { error } = await safeQuery(() => supabase.from('products').select('id').limit(1));
    return !error;
  } catch {
    return false;
  }
};
