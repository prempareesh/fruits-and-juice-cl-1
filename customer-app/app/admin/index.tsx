import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import { useLocalSearchParams } from 'expo-router';

// Use the local network IP for cross-device connectivity (Phone <-> Computer)
const LOCAL_IP = '192.168.1.7'; 
const BASE_DASHBOARD_URL = Platform.OS === 'web' ? `http://${LOCAL_IP}:3000` : `http://${LOCAL_IP}:3000`;
const FALLBACK_DASHBOARD_URL = `${BASE_DASHBOARD_URL}/admin/dashboard`;

export default function AdminBridge() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessionUrl, setSessionUrl] = useState(FALLBACK_DASHBOARD_URL);
  const webViewRef = React.useRef<any>(null);

  React.useEffect(() => {
    async function getSessionAndBuildUrl() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Build the correct target path based on role/params
      const targetPath = '/admin/dashboard';
      
      const baseUrl = `${BASE_DASHBOARD_URL}${targetPath}`;

      if (session) {
        // Pass access_token and refresh_token for SSO, plus storeId if available
        const ssoUrl = `${baseUrl}?access_token=${session.access_token}&refresh_token=${session.refresh_token}${storeId ? `&storeId=${storeId}` : ''}`;
        setSessionUrl(ssoUrl);
      } else {
        setSessionUrl(FALLBACK_DASHBOARD_URL);
      }
    }
    getSessionAndBuildUrl();
  }, [storeId]);

  const reload = () => {
    if (Platform.OS === 'web') {
      // For web, we just refresh the whole page or target the iframe
      window.location.reload();
    } else {
      webViewRef.current?.reload();
    }
  };

  // Web redirect handler
  React.useEffect(() => {
    if (Platform.OS === 'web' && sessionUrl !== FALLBACK_DASHBOARD_URL) {
      setLoading(true);
      // Small delay to show the connection message
      const timer = setTimeout(() => {
        window.location.href = sessionUrl;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sessionUrl]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Mini Header for Navigation Control */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)')}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={COLORS.darkText} />
          <Text style={styles.backText}>Exit Admin</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity onPress={reload} style={styles.actionBtn}>
            <RefreshCcw size={20} color={COLORS.mutedGray} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.webviewContainer}>
        {Platform.OS === 'web' ? (
          /* WEB-FRIENDLY REDIRECT OVERLAY */
          <View style={styles.loadingOverlay}>
            <LinearGradient
              colors={['#ffffff', '#f0fdf4']}
              style={StyleSheet.absoluteFill}
            />
            <ActivityIndicator size="large" color={COLORS.primaryGreen} />
            <Text style={styles.loadingTitle}>Authenticating Admin...</Text>
            <Text style={styles.loadingSubtitle}>Securing your unified session</Text>
            <TouchableOpacity 
              onPress={() => window.location.href = sessionUrl}
              style={styles.manualRedirect}
            >
              <Text style={styles.manualRedirectText}>Click here if not redirected automatically</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* MOBILE-NATIVE WEBVIEW */
          <>
            <WebView
              ref={webViewRef}
              source={{ uri: sessionUrl }}
              style={styles.webview}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primaryGreen} />
                <Text style={styles.loadingText}>Connecting to Premium Dashboard...</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkText,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingTitle: {
    marginTop: 24,
    fontSize: 20,
    color: '#064e3b',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  manualRedirect: {
    marginTop: 40,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  manualRedirectText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.mutedGray,
    fontWeight: '600',
  }
});
