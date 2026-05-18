import * as React from 'react';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { JuicyLogo } from '../src/components/JuicyLogo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  // toastRef removed since we use global Toast

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const redirectTo = makeRedirectUri({
        scheme: 'padmavati',
      });
      
      console.log('[GOOGLE_SIGNIN] Auth redirect URL:', redirectTo);
 
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
 
      if (error) throw error;
 
      if (data?.url) {
        console.log('[GOOGLE_SIGNIN] Opening auth session manually...');
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (result.type === 'success' && result.url) {
          console.log('[GOOGLE_SIGNIN] Auth session returned, parsing tokens...');
          const url = result.url;
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
              console.log('[GOOGLE_SIGNIN] Exchanging session tokens...');
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });
              if (sessionError) throw sessionError;
              console.log('[GOOGLE_SIGNIN] Session exchange successful!');
              Toast.show({ type: 'success', text1: 'Google Login successful' });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[GOOGLE_SIGNIN_ERROR]', err);
      Alert.alert('Google Sign-In Failed', err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail && !password) {
      Toast.show({ type: 'error', text1: 'Please enter email and password' });
      return;
    }

    if (!cleanEmail) {
      Toast.show({ type: 'error', text1: 'Email is required' });
      return;
    }

    if (!password) {
      Toast.show({ type: 'error', text1: 'Password is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Toast.show({ type: 'error', text1: 'Enter valid email address' });
      return;
    }

    setLoading(true);

    try {
      console.log('[LOGIN] Attempting login for:', cleanEmail);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        console.error('[LOGIN_ERROR]', error.message);
        
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          Toast.show({ type: 'error', text1: 'Invalid email or password' });
        } else if (error.message.includes('Email not confirmed')) {
          Toast.show({ type: 'error', text1: 'Please verify your email address.' });
        } else {
          // CASE 6: Network/API error
          Toast.show({ type: 'error', text1: 'Something went wrong. Try again.' });
        }
        return;
      }

      if (data?.session) {
        console.log('[LOGIN_SUCCESS] Session established for:', data.user.id);
        Toast.show({ type: 'success', text1: 'Login successful' });
        // Redirection is handled automatically by AuthProvider's effect
      }
    } catch (err: any) {
      console.error('[LOGIN_SYSTEM_ERROR]', err);
      Toast.show({ type: 'error', text1: 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { fontSize: 20 }]}>Padmavati Fresh Fruits & Juices</Text>
            <Text style={styles.subtitle}>Fresh Fruits, Vegetables & Juices Delivery</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputBox}>
                <Mail size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94a3b8" />
                  ) : (
                    <Eye size={18} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.btn} 
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.gradient}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              <Text style={{ marginHorizontal: 10, color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            </View>

            <TouchableOpacity 
              style={[styles.btn, { marginTop: 0 }]} 
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              <View style={[styles.gradient, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }]}>
                {googleLoading ? (
                  <ActivityIndicator color="#64748b" />
                ) : (
                  <>
                    <Image 
                      source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.png' }} 
                      style={{ width: 18, height: 18 }} 
                      resizeMode="contain"
                    />
                    <Text style={[styles.btnText, { color: '#334155' }]}>Sign In with Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.link}>Join Padmavati Fresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scroll: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  logo: { width: 120, height: 120, marginBottom: 10 },
  title: { fontSize: 36, fontWeight: '900', color: '#1e293b', letterSpacing: -1.5 },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4, textAlign: 'center' },
  form: { gap: 24 },
  inputGroup: { gap: 10 },
  label: { fontSize: 14, fontWeight: '800', color: '#334155' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b' },
  eyeBtn: { padding: 4 },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  gradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748b' },
  link: { color: '#10b981', fontWeight: '800' }
});
