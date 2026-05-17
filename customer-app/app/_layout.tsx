import 'react-native-gesture-handler';
import * as React from 'react';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
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
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/store/ThemeContext';
import { AuthProvider } from '../src/providers/AuthProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Platform, View, StyleSheet } from 'react-native';
import ToastMessage from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep splash visible until fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <SafeAreaProvider>
              <View style={{ flex: 1 }}>
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="signup" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="admin" />
                  <Stack.Screen name="search" options={{ animation: 'fade' }} />
                </Stack>
                <ToastMessage />
              </View>
              <StatusBar style="auto" />
            </SafeAreaProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
