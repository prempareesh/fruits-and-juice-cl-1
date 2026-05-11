import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCcw } from 'lucide-react-native';
import { COLORS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';

// The live Vercel URL
const ADMIN_DASHBOARD_URL = 'https://admin-dashboard-juice.vercel.app/admin/login';

export default function AdminBridge() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionUrl, setSessionUrl] = useState(ADMIN_DASHBOARD_URL);
  const webViewRef = React.useRef<any>(null);

  React.useEffect(() => {
    async function getSessionAndBuildUrl() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Pass access_token and refresh_token to the dashboard for auto-login
        const ssoUrl = `${ADMIN_DASHBOARD_URL}?access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
        setSessionUrl(ssoUrl);
      }
    }
    getSessionAndBuildUrl();
  }, []);

  const reload = () => {
    if (Platform.OS === 'web') {
      // For web, we just refresh the whole page or target the iframe
      window.location.reload();
    } else {
      webViewRef.current?.reload();
    }
  };

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
          /* WEB-FRIENDLY IFRAME */
          <iframe 
            src={sessionUrl}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              borderRadius: 0
            }}
            onLoad={() => setLoading(false)}
          />
        ) : (
          /* MOBILE-NATIVE WEBVIEW */
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
        )}
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primaryGreen} />
            <Text style={styles.loadingText}>Connecting to Premium Dashboard...</Text>
          </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.mutedGray,
    fontWeight: '600',
  }
});
