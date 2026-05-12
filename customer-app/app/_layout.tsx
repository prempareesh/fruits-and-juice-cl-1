import 'react-native-gesture-handler';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { 
  Outfit_400Regular, 
  Outfit_600SemiBold, 
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import { 
  Poppins_400Regular, 
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { 
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold 
} from '@expo-google-fonts/cormorant-garamond';
import { useFonts } from 'expo-font';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/store/ThemeContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { IntroSequence } from '../src/components/ui/IntroSequence';
import { Platform, View, StyleSheet } from 'react-native';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import { useRef } from 'react';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const [showWebIntro, setShowWebIntro] = useState(() => {
    if (Platform.OS !== 'web') return false;
    try {
      return sessionStorage.getItem('hasSeenIntro') !== 'true';
    } catch {
      return true;
    }
  });
  const segments = useSegments();
  const router = useRouter();
  const toastRef = useRef<ToastHandle>(null);

  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  const [fontTimeout, setFontTimeout] = useState(false);

  useEffect(() => {
    const fTimer = setTimeout(() => {
      console.log('[Boot] Font timeout reached, forcing render');
      setFontTimeout(true);
    }, 800);
    return () => clearTimeout(fTimer);
  }, []);

  useEffect(() => {
    // Safety fallback: if auth takes too long, just initialize
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.log('[Boot] Auth timeout reached, forcing initialization');
        setInitialized(true);
      }
    }, 1000);

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
          .then(({ data, error }) => {
            if (error) console.warn('Role fetch error:', error);
            if (data?.role && data.role !== 'user') {
              setUserRole(data.role);
            }
          });
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
          .then(({ data, error }) => {
            if (error) console.warn('Role fetch error:', error);
            if (data?.role && data.role !== 'user') setUserRole(data.role);
          });
      } else {
        setUserRole(null);
      }
    });
    // GLOBAL CUSTOMER NOTIFICATIONS
    let orderChannel: any;

    async function setupGlobalNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      orderChannel = supabase
        .channel(`global_customer_orders_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            const oldStatus = payload.old.status;
            
            if (newStatus !== oldStatus) {
              toastRef.current?.show(`Order Status Update: Your order is now ${newStatus.toUpperCase()}! 🥤`, 'info');
            }
          }
        )
        .subscribe();
    }

    setupGlobalNotifications();

    return () => {
      subscription.unsubscribe();
      if (orderChannel) supabase.removeChannel(orderChannel);
    };
  }, []);

  useEffect(() => {
    if (!initialized || (!fontsLoaded && !fontTimeout) || showWebIntro) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = !segments.length || segments[0] === 'index';

    if (!session || !session.user) {
      if (!inAuthGroup) {
        console.log("[Auth] No session, redirecting to signup");
        router.replace('/signup');
      }
    } else if (userRole) {
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'store_admin') {
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
      <GestureHandlerRootView style={{ flex: 1 }}>
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
                    fontFamily: 'Calibri',
                    fontWeight: '700',
                  },
                  headerShadowVisible: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="admin" options={{ headerShown: false }} />
                <Stack.Screen name="payment" options={{ title: 'Secure Payment' }} />
                <Stack.Screen name="product/[id]" options={{ title: 'Fresh Pick' }} />
                <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
                <Stack.Screen name="orders/[id]" options={{ title: 'Order Details' }} />
              </Stack>
              <Toast ref={toastRef} />
              {Platform.OS === 'web' && showWebIntro && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 99999, backgroundColor: 'black' }]}>
                  <IntroSequence onComplete={() => setShowWebIntro(false)} />
                </View>
              )}
            </View>
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

