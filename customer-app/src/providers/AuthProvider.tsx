import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { useCartStore } from '../store/useCartStore';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'customer';
  address?: string;
  phone?: string;
  saved_addresses?: any[];
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: 'admin' | 'customer' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<'admin' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let mounted = true;
    let initialSessionFetched = false;

    // Retrieve initial session once to set up start state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && !initialSessionFetched) {
        initialSessionFetched = true;
        handleStateChange(session);
      }
    }).catch(err => {
      console.error('[AUTH_ERROR] Initialization failed:', err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH_EVENT] Change detected:', event);
      if (event === 'INITIAL_SESSION') {
        // Skip duplicate INITIAL_SESSION trigger since getSession handles the startup state
        return;
      }
      if (mounted) {
        await handleStateChange(session);
      }
    });

    // Handle deep links from Google OAuth redirect (padmavati://)
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[AUTH_DEEPLINK] Incoming redirect URL:', event.url);
      if (!event.url) return;

      const url = event.url;
      const hashIndex = url.indexOf('#');
      let searchString = '';
      if (hashIndex !== -1) {
        searchString = url.substring(hashIndex + 1);
      } else {
        const questionIndex = url.indexOf('?');
        if (questionIndex !== -1) {
          searchString = url.substring(questionIndex + 1);
        }
      }

      if (searchString) {
        const params: Record<string, string> = {};
        const pairs = searchString.split('&');
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        }

        if (params.access_token && params.refresh_token) {
          console.log('[AUTH_DEEPLINK] Session tokens found, exchanging session...');
          try {
            setLoading(true);
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            if (sessionError) throw sessionError;
            console.log('[AUTH_DEEPLINK] Session successfully exchanged and persisted!');
          } catch (err: any) {
            console.error('[AUTH_DEEPLINK_ERROR] Failed to exchange session:', err.message);
            setLoading(false);
          }
        }
      }
    };

    // Import expo-linking dynamically or statically
    const Linking = require('expo-linking');
    const subscriptionLink = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      subscriptionLink.remove();
    };
  }, []);

  const handleStateChange = async (newSession: Session | null) => {
    const newUser = newSession?.user ?? null;
    setSession(newSession);
    setUser(newUser);
    
    if (newUser) {
      console.log('[AUTH_DEBUG] Authenticated User ID:', newUser.id);
      await fetchProfile(newUser);
    } else {
      setProfile(null);
      setRole(null);
      setLoading(false);
    }
  };

  const fetchProfile = async (currUser: User) => {
    // Safety timeout to prevent infinite hang
    const timeoutId = setTimeout(() => {
      console.warn('[AUTH_TIMEOUT] Profile fetch taking too long, defaulting to customer');
      setRole('customer');
      setLoading(false);
    }, 8000);

    try {
      console.log('[AUTH_DEBUG] Fetching profile for:', currUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currUser.id)
        .maybeSingle();
      
      clearTimeout(timeoutId);

      if (error || !data) {
        if (error) console.warn('[AUTH_DEBUG] Profile fetch error:', error.message);
        else console.log('[AUTH_DEBUG] Profile missing for user:', currUser.id);
        
        // SELF-HEALING: Auto-create missing profile instantly
        console.log('[AUTH_DEBUG] Self-healing: Creating missing profile...');
        const newRole = currUser.email === 'admin@freshflow.com' ? 'admin' : 'customer';
        const newProfile: any = { 
          id: currUser.id, 
          role: newRole, 
          full_name: currUser.user_metadata?.full_name || 'Customer',
          phone: currUser.user_metadata?.phone || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        let { error: upsertError } = await supabase.from('profiles').upsert({ ...newProfile, email: currUser.email });
        
        if (upsertError && (upsertError.message?.includes('email') || upsertError.code === '42703')) {
          console.log('[AUTH_DEBUG] Profiles table missing email column, retrying without email...');
          const { error: retryError } = await supabase.from('profiles').upsert(newProfile);
          upsertError = retryError;
        }
        
        if (!upsertError) {
          setRole(newRole as any);
          setProfile({ ...newProfile, email: currUser.email } as any);
          setLoading(false);
          return;
        }
        console.error('[AUTH_ERROR] Self-healing failed:', upsertError.message);

        setRole('customer');
        setProfile(null);
      } else {
        console.log('[AUTH_DEBUG] Fetched Profile:', data);
        
        // SELF-HEALING: Ensure admin@freshflow.com ALWAYS has the admin role
        if (currUser.email === 'admin@freshflow.com' && data.role !== 'admin') {
          console.log('[AUTH_DEBUG] Self-healing: Correcting admin role...');
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', currUser.id);
          setRole('admin');
          setProfile({ ...data, role: 'admin' });
          setLoading(false);
          return;
        }

        setProfile(data);
        setRole(data.role || 'customer');
      }
    } catch (err) {
      console.error('[AUTH_ERROR] Unexpected error in fetchProfile:', err);
      setRole('customer');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  // Centralized Routing Guards
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const inAdminGroup = segments[0] === 'admin';
    const inTabsGroup = segments[0] === '(tabs)';
    const isRoot = (segments as any).length === 0;

    console.log('[AUTH_ROUTING] Segments:', segments, 'Role:', role);

    if (!session) {
      if (!inAuthGroup) {
        console.log('[AUTH_REDIRECT] Not authenticated -> /login');
        router.replace('/login');
      }
    } else if (role) {
      if (inAuthGroup || isRoot) {
        const destination = role === 'admin' ? '/admin' : '/(tabs)';
        console.log(`[AUTH_REDIRECT] Authenticated (${role}) -> ${destination}`);
        router.replace(destination as any);
      } else if (inAdminGroup && role !== 'admin') {
        console.warn('[AUTH_GUARD] Access Denied: Admin only');
        router.replace('/(tabs)');
      }
      // Removed the guard that forced admins back to /admin from /(tabs) 
      // to allow "View Store" functionality.
    }
  }, [session, role, loading, segments]);

  const signOut = async () => {
    try {
      setLoading(true);
      
      // 1. Clear Supabase Session
      await supabase.auth.signOut();
      
      // 2. Clear Local State
      setProfile(null);
      setRole(null);
      setSession(null);
      setUser(null);
      
      // 3. Clear Cart & Persisted Data
      useCartStore.getState().clearCart();
      
      console.log('[AUTH_DEBUG] Signout successful, redirecting...');
      router.replace('/login');
    } catch (err) {
      console.error('[AUTH_ERROR] Signout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
