import * as React from 'react';
import { useState, useEffect } from 'react';
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
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { Mail, Lock, ArrowRight, Leaf } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../src/theme/tokens';
import { Celebration } from '../src/components/ui/Celebration';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import Animated, { FadeIn, ZoomIn, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { CheckCircle } from 'lucide-react-native';
import { Balloons } from '../src/components/ui/balloons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const toastRef = React.useRef<ToastHandle>(null);
  const balloonsRef = React.useRef<{ launchAnimation: () => void } | null>(null);

  // Trigger balloons on success
  useEffect(() => {
    if (loginSuccess && Platform.OS === 'web') {
      // Small delay to ensure component is mounted if needed, or trigger immediately
      const timer = setTimeout(() => {
        balloonsRef.current?.launchAnimation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess]);

  // Redirect after success animation
  useEffect(() => {
    if (loginSuccess) {
      const checkRoleAndRedirect = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('profiles')
              .select('role, store_id')
              .eq('id', user.id)
              .maybeSingle();
            
            const userRole = data?.role || 'customer';
            const storeId = data?.store_id;
            
            if (userRole === 'super_admin' || userRole === 'admin') {
              if (Platform.OS === 'web') {
                // Production Vercel Dashboard URL
                const DASHBOARD_URL = "https://admin-dashboard-juice-icmc.vercel.app/admin/dashboard";
                window.location.href = DASHBOARD_URL;
              } else {
                router.replace('/admin');
              }
            } else if (userRole === 'store_admin' && storeId) {
              router.replace(`/admin?storeId=${storeId}`);
            } else {
              router.replace('/(tabs)');
            }
          } else {
            router.replace('/(tabs)');
          }
        } catch (err) {
          console.error("Login redirect error:", err);
          router.replace('/(tabs)');
        }
      };
      
      const timer = setTimeout(() => {
        checkRoleAndRedirect();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess]);

  const validateEmail = (val: string) => {
    if (!val) return "Please enter your email";
    if (!/\S+@\S+\.\S+/.test(val)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return "Please enter your password";
    if (val.length < 6) return "Password must be at least 6 chars";
    return null;
  };

  const handleLogin = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    
    if (eErr || pErr) {
      setEmailError(eErr);
      setPasswordError(pErr);
      setTouched({ email: true, password: true });
      return;
    }
    
    setLoading(true);
    
    const maxRetries = 3;
    const baseDelay = 500; // 0.5s base for backoff

    const performSignIn = async (attempt: number): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          // Explicitly handle all auth errors to prevent silent failures
          console.error("[Auth] Login error details:", error);
          
          let userMessage = 'Invalid email or password.';
          if (error.message.includes('Email not confirmed')) {
            userMessage = 'Please verify your email address before signing in.';
          } else if (error.message.includes('Rate limit')) {
            userMessage = 'Too many attempts. Please wait a moment.';
          } else if (error.message.includes('Database error')) {
            userMessage = 'Server maintenance in progress. Try again soon.';
          }
          
          toastRef.current?.show(userMessage, 'error');
          setLoading(false);
          return;
        }

        if (data?.session) {
          setLoginSuccess(true);
        }
      } catch (err: any) {
        console.error("[Auth] performSignIn critical exception:", err);
        const errorMessage = err?.message || 'Connection issue. Please try again.';
        const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                              errorMessage.toLowerCase().includes('fetch');

        if (attempt < maxRetries && isNetworkError) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`[Auth] Network failure. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return performSignIn(attempt + 1);
        }

        setLoading(false);
        toastRef.current?.show(errorMessage, 'error');
      }
    };

    await performSignIn(0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast ref={toastRef} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.headerBackground}>
            <LinearGradient
              colors={['#f0fdf4', '#dcfce7', '#ffffff']}
              style={styles.gradientBg}
            />
            <View style={styles.leaf1}>
              <Leaf size={100} color="#bcf0da" fill="#bcf0da" style={{ transform: [{ rotate: '15deg' }] }} />
            </View>
            <View style={styles.leaf2}>
              <Leaf size={80} color="#dcfce7" fill="#dcfce7" style={{ transform: [{ rotate: '-25deg' }] }} />
            </View>
          </View>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[COLORS.primaryGreen, '#059669']}
                style={styles.logoGradient}
              >
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=200' }} 
                  style={styles.logo}
                />
              </LinearGradient>
            </View>
            <Text style={styles.title}>JuiceShop</Text>
            <Text style={styles.subtitle}>Pure Nature, Spontaneous Health.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email Address</Text>
                {emailError && touched.email && (
                  <Animated.View entering={FadeInUp} style={styles.errorContainer}>
                    <Text style={styles.errorTextSmall}>{emailError}</Text>
                  </Animated.View>
                )}
              </View>
              <View style={[
                styles.inputContainer,
                emailError && touched.email && styles.inputError,
                !emailError && touched.email && email.length > 0 && styles.inputSuccess
              ]}>
                <Mail size={20} color={emailError && touched.email ? "#ef4444" : (email.length > 0 && !emailError ? COLORS.primaryGreen : "#94a3b8")} />
                <TextInput 
                  style={styles.input}
                  placeholder="john@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (touched.email) setEmailError(validateEmail(val));
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true }));
                    setEmailError(validateEmail(email));
                  }}
                  placeholderTextColor="#94a3b8"
                />
                {!emailError && touched.email && email.length > 0 && (
                  <Animated.View entering={ZoomIn}>
                    <CheckCircle size={18} color={COLORS.primaryGreen} />
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                {passwordError && touched.password && (
                  <Animated.View entering={FadeInUp} style={styles.errorContainer}>
                    <Text style={styles.errorTextSmall}>{passwordError}</Text>
                  </Animated.View>
                )}
              </View>
              <View style={[
                styles.inputContainer,
                passwordError && touched.password && styles.inputError,
                !passwordError && touched.password && password.length > 0 && styles.inputSuccess
              ]}>
                <Lock size={20} color={passwordError && touched.password ? "#ef4444" : (password.length > 0 && !passwordError ? COLORS.primaryGreen : "#94a3b8")} />
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (touched.password) setPasswordError(validatePassword(val));
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, password: true }));
                    setPasswordError(validatePassword(password));
                  }}
                  placeholderTextColor="#94a3b8"
                />
                {!passwordError && touched.password && password.length > 0 && (
                  <Animated.View entering={ZoomIn}>
                    <CheckCircle size={18} color={COLORS.primaryGreen} />
                  </Animated.View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.loginBtnContainer} 
              onPress={handleLogin}
              disabled={loading || loginSuccess}
            >
              <LinearGradient
                colors={loading || (emailError || passwordError) && (touched.email || touched.password) ? ['#d1d5db', '#9ca3af'] : ['#10b981', '#059669']}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.link}>Join the Nature</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legal}>
              <Text style={styles.legalText}>Secure & Encrypted Session </Text>
              <Lock size={12} color="#cbd5e1" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {loginSuccess && (
        <Animated.View 
          entering={FadeIn}
          style={styles.successOverlay}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[COLORS.primaryGreen, '#059669']}
            style={styles.successGradient}
          >
            <Animated.View 
              entering={ZoomIn.delay(200).springify()} 
              style={styles.successIconContainer}
            >
              <View style={styles.glowEffect} />
              <CheckCircle color={COLORS.white} size={60} />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(400).springify()}>
              <Text style={styles.successTitle}>Welcome Back!</Text>
              <View style={styles.userBadge}>
                <Mail size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.successEmail}>{email}</Text>
              </View>
              <Text style={styles.successSubtitle}>Preparing your fresh experience...</Text>
            </Animated.View>
            <ActivityIndicator color={COLORS.white} style={{ marginTop: 32 }} />
          </LinearGradient>
          <Balloons ref={balloonsRef} type="default" />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  successGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    color: COLORS.white,
    fontFamily: 'Calibri',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
    alignSelf: 'center',
  },
  successEmail: {
    color: COLORS.white,
    fontFamily: 'Calibri',
    fontSize: 14,
    fontWeight: '700',
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Calibri',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  glowEffect: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: -1,
  },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    zIndex: -1,
  },
  gradientBg: { width: '100%', height: '100%' },
  leaf1: { position: 'absolute', top: -20, left: -30, opacity: 0.3 },
  leaf2: { position: 'absolute', top: 100, right: -20, opacity: 0.2 },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 15,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  logoGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 70, height: 70, borderRadius: 35 },
  title: { 
    fontFamily: 'Calibri',
    fontSize: 32, 
    color: '#064e3b', 
    fontWeight: '900' 
  },
  subtitle: { 
    fontFamily: 'Calibri',
    fontSize: 15, 
    color: '#065f46', 
    textAlign: 'center', 
    marginTop: 8, 
    opacity: 0.7 
  },
  form: { padding: 30, paddingBottom: 50 },
  inputGroup: { marginBottom: 15 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { 
    fontFamily: 'Calibri',
    fontSize: 14, 
    color: '#374151', 
    fontWeight: '700' 
  },
  errorTextSmall: { 
    fontFamily: 'Calibri',
    fontSize: 11, 
    color: '#ef4444', 
    fontWeight: '700' 
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#e5e7eb' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff1f2' },
  inputSuccess: { borderColor: COLORS.primaryGreen, backgroundColor: '#f0fdf4' },
  errorContainer: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  input: { 
    fontFamily: 'Calibri',
    flex: 1, 
    paddingVertical: 16, 
    marginLeft: 12, 
    fontSize: 16, 
    color: '#111827' 
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 10, paddingVertical: 4 },
  forgotText: { 
    fontFamily: 'Calibri',
    fontSize: 13, 
    color: '#64748b', 
    fontWeight: '700' 
  },
  loginBtnContainer: { marginTop: 25, borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  loginBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18 },
  loginBtnText: { 
    fontFamily: 'Calibri',
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: '900', 
    marginRight: 10 
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { fontSize: 15, color: '#6b7280' },
  link: { 
    fontFamily: 'Calibri',
    fontSize: 15, 
    color: '#059669', 
    fontWeight: '700' 
  },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  legalText: { fontSize: 12, color: '#9ca3af', marginRight: 4 },
});
