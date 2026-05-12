import * as React from 'react';
import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Mail, ArrowRight, ChevronLeft, Send, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import { COLORS } from '../src/theme/tokens';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const router = useRouter();
  const toastRef = React.useRef<ToastHandle>(null);

  const validateEmail = (val: string) => {
    if (!val) return "Please enter your email";
    if (!/\S+@\S+\.\S+/.test(val)) return "Please enter a valid email address";
    return null;
  };

  const handleReset = async () => {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'juiceshop://reset-password',
      });

      if (error) throw error;
      setSent(true);
      toastRef.current?.show('Reset link sent to your email!', 'success');
    } catch (err: any) {
      toastRef.current?.show(err.message || 'Failed to send reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
             <LinearGradient colors={['#10b981', '#059669']} style={styles.iconGradient}>
                <Send size={40} color="#fff" />
             </LinearGradient>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <Text style={styles.successTitle}>Check Your Inbox</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to:{"\n"}
              <Text style={{ fontWeight: '800', color: '#10b981' }}>{email}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.backBtnSuccess}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.backBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast ref={toastRef} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
            <ChevronLeft size={28} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</Text>
          </View>

          <View style={styles.form}>
             <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Email Address</Text>
                  {emailError && (
                    <Animated.View entering={FadeInUp} style={styles.errorContainer}>
                      <Text style={styles.errorTextSmall}>{emailError}</Text>
                    </Animated.View>
                  )}
                </View>
                <View style={[
                  styles.inputContainer, 
                  emailError && styles.inputError,
                  !emailError && email.length > 0 && styles.inputSuccess
                ]}>
                  <Mail size={20} color={emailError ? "#ef4444" : (email.length > 0 ? COLORS.primaryGreen : "#94a3b8")} />
                  <TextInput 
                    style={styles.input}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setEmailError(validateEmail(val));
                    }}
                  />
                  {!emailError && email.length > 0 && (
                    <Animated.View entering={ZoomIn}>
                      <CheckCircle size={18} color={COLORS.primaryGreen} />
                    </Animated.View>
                  )}
                </View>
             </View>

             <TouchableOpacity 
               activeOpacity={0.9}
               style={styles.btnContainer}
               onPress={handleReset}
               disabled={loading || !!emailError || email.length === 0}
             >
               <LinearGradient 
                colors={loading || emailError || email.length === 0 ? ['#d1d5db', '#9ca3af'] : ['#10b981', '#059669']} 
                style={styles.btn}
               >
                 {loading ? <ActivityIndicator color="#fff" /> : (
                   <>
                    <Text style={styles.btnText}>Send Reset Link</Text>
                    <ArrowRight size={20} color="#fff" />
                   </>
                 )}
               </LinearGradient>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 32 },
  backArrow: { marginBottom: 32, marginLeft: -8 },
  header: { marginBottom: 40 },
  title: { 
    fontFamily: 'Calibri',
    fontSize: 32, 
    fontWeight: '900', 
    color: '#1e293b' 
  },
  subtitle: { 
    fontFamily: 'Calibri',
    fontSize: 16, 
    color: '#64748b', 
    marginTop: 12, 
    lineHeight: 24 
  },
  form: { marginTop: 8 },
  inputGroup: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { 
    fontFamily: 'Calibri',
    fontSize: 14, 
    fontWeight: '700', 
    color: '#374151' 
  },
  errorTextSmall: { 
    fontFamily: 'Calibri',
    fontSize: 11, 
    color: '#ef4444', 
    fontWeight: '700' 
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 18, paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#e2e8f0' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff1f2' },
  inputSuccess: { borderColor: COLORS.primaryGreen, backgroundColor: '#f0fdf4' },
  errorContainer: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  input: { 
    fontFamily: 'Calibri',
    flex: 1, 
    paddingVertical: 18, 
    marginLeft: 12, 
    fontSize: 16, 
    color: '#1e293b' 
  },
  btnContainer: { borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, marginTop: 16 },
  btn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 12 },
  btnText: { 
    fontFamily: 'Calibri',
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '800' 
  },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { width: 100, height: 100, borderRadius: 50, marginBottom: 32 },
  iconGradient: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  successTitle: { 
    fontFamily: 'Calibri',
    fontSize: 28, 
    fontWeight: '900', 
    color: '#1e293b', 
    textAlign: 'center' 
  },
  successSubtitle: { 
    fontFamily: 'Calibri',
    fontSize: 16, 
    color: '#64748b', 
    textAlign: 'center', 
    marginTop: 16, 
    lineHeight: 24 
  },
  backBtnSuccess: { marginTop: 40, paddingVertical: 12 },
  backBtnText: { 
    fontFamily: 'Calibri',
    color: '#10b981', 
    fontSize: 16, 
    fontWeight: '700' 
  }
});
