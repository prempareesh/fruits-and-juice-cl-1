import 'react-native-gesture-handler';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Outfit_400Regular, 
  Outfit_600SemiBold, 
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import { 
  Poppins_400Regular, 
  Poppins_600SemiBold 
} from '@expo-google-fonts/poppins';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/store/ThemeContext';
import { View, StyleSheet } from 'react-native';

import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.warn('Splash screen error:', e);
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [fontTimeout, setFontTimeout] = useState(false);

  useEffect(() => {
    const fTimer = setTimeout(() => {
      console.log('[Boot] Font timeout reached, forcing render');
      setFontTimeout(true);
    }, 1500);
    return () => clearTimeout(fTimer);
  }, []);

  useEffect(() => {
    // Safety fallback: if auth takes too long, just initialize
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.log('[Boot] Auth timeout reached, forcing initialization');
        setInitialized(true);
      }
    }, 1500);

    // Check initial session safely (local fast read)
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      
      // OPTIMISTIC BOOT: Assume customer instantly to unblock UI
      if (session?.user) setUserRole(prev => prev || 'user');
      setInitialized(true);

      if (session?.user) {
        // Background sync admin role without blocking UI
        supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => {
            if (data?.role && data.role !== 'user') {
              setUserRole(data.role);
            }
          })
          .catch(() => {});
      }
    }).catch(err => {
      clearTimeout(timeout);
      console.error("Supabase Auth Error on boot:", err);
      setInitialized(true);
    });

    // Listen for auth changes (runs async)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] Event: ${event}, Session: ${session ? 'Active' : 'Null'}`);
      setSession(session);
      if (session?.user) {
        setUserRole(prev => prev || 'user'); // Optimistic
        supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => {
            if (data?.role && data.role !== 'user') setUserRole(data.role);
          })
          .catch(() => {});
      } else {
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized || (!fontsLoaded && !fontTimeout)) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = !segments.length || segments[0] === 'index';

    if (!session || !session.user) {
      if (!inAuthGroup) {
        console.log("[Auth] No session, redirecting to signup");
        router.replace('/signup');
      }
    } else if (userRole) {
      if (userRole === 'admin') {
        if (segments[0] !== 'admin') {
          console.log("[Auth] Admin detected, redirecting to /admin");
          router.replace('/admin');
        }
      } else {
        if (inAuthGroup || isRoot || segments[0] === 'admin') {
          console.log("[Auth] Customer detected, redirecting to /(tabs)");
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, initialized, segments, fontsLoaded, fontTimeout, userRole]);

  useEffect(() => {
    if (fontsLoaded || fontError || fontTimeout) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  if (!fontsLoaded && !fontError && !fontTimeout) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#ffffff',
                },
                headerTintColor: '#10b981',
                headerTitleStyle: {
                  fontFamily: 'Outfit_700Bold',
                },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="payment" options={{ title: 'Secure Payment' }} />
              <Stack.Screen name="product/[id]" options={{ title: 'Fresh Pick' }} />
              <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
              <Stack.Screen name="orders/[id]" options={{ title: 'Order Details' }} />
            </Stack>
          </View>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
