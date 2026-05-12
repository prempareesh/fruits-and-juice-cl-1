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
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Phone, ArrowRight, User, Mail, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import { Celebration } from '../src/components/ui/Celebration';
import { COLORS } from '../src/theme/tokens';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const router = useRouter();
  const toastRef = React.useRef<ToastHandle>(null);

  const validate = (field: string, value: string) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return "Please enter your name";
        return null;
      case 'email':
        if (!value.trim()) return "Please enter your email";
        if (!/\S+@\S+\.\S+/.test(value)) return "Please enter a valid email address";
        return null;
      case 'phone':
        if (!value.trim()) return "Please enter your phone number";
        if (value.length < 10) return "Please enter a valid phone number";
        return null;
      case 'password':
        if (!value) return "Please enter your password";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
      case 'confirmPassword':
        if (value !== password) return "Passwords do not match";
        return null;
      default:
        return null;
    }
  };

  const handleSignup = async () => {
    const newErrors = {
      name: validate('name', name),
      email: validate('email', email),
      phone: validate('phone', phone),
      password: validate('password', password),
      confirmPassword: validate('confirmPassword', confirmPassword),
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });

    if (Object.values(newErrors).some(err => err !== null)) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim(), phone: phone.trim() }
        }
      });

      if (error) throw error;

      if (data?.user) {
        setSignupDone(true);
      }
    } catch (err: any) {
      toastRef.current?.show(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Post-signup confirmation screen ──────────────────────────────────────
  if (signupDone) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          style={StyleSheet.absoluteFill}
        />
        <Celebration />
        
        <View style={styles.successContainer}>
          <Animated.View 
            entering={ZoomIn.duration(800).springify()}
            style={styles.successIcon}
          >
            <LinearGradient
              colors={[COLORS.primaryGreen, '#059669']}
              style={styles.iconGradient}
            >
              <Mail size={48} color={COLORS.white} />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <Text style={styles.successTitle}>Check Your Email!</Text>
            
            <View style={styles.contextCard}>
              <Text style={styles.successBody}>
                We sent a verification link to:
              </Text>
              <Text style={styles.emailHighlight}>{email}</Text>
            </View>

            <Text style={styles.successNote}>
              Tap the link in the email to verify your account, then come back to start your fresh journey.
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(600).springify()}
            style={styles.actionContainer}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.goLoginBtn}
              onPress={() => router.replace('/login')}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.goLoginGradient}>
                <Text style={styles.goLoginText}>Go to Sign In</Text>
                <ArrowRight size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={async () => {
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email.trim().toLowerCase(),
                  });
                  if (error) throw error;
                  toastRef.current?.show('Verification email resent!', 'success');
                } catch (e: any) {
                  toastRef.current?.show(e.message, 'error');
                }
              }}
            >
              <Text style={styles.resendText}>Didn't receive it? <Text style={{ textDecorationLine: 'underline' }}>Resend email</Text></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fresh juices delivered to your door 🍊</Text>
          </View>

          <View style={styles.form}>
            <Field label="Full Name" touched={touched.name} error={touched.name ? errors.name : null} icon={<User size={20} color={touched.name && errors.name ? "#ef4444" : "#94a3b8"} />}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Preetham Goud"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (touched.name) setErrors(prev => ({ ...prev, name: validate('name', val) }));
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, name: true }));
                  setErrors(prev => ({ ...prev, name: validate('name', name) }));
                }}
                autoCapitalize="words"
              />
            </Field>

            <Field label="Email Address" touched={touched.email} error={touched.email ? errors.email : null} icon={<Mail size={20} color={touched.email && errors.email ? "#ef4444" : "#94a3b8"} />}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (touched.email) setErrors(prev => ({ ...prev, email: validate('email', val) }));
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, email: true }));
                  setErrors(prev => ({ ...prev, email: validate('email', email) }));
                }}
              />
            </Field>

            <Field label="Phone Number" touched={touched.phone} error={touched.phone ? errors.phone : null} icon={<Phone size={20} color={touched.phone && errors.phone ? "#ef4444" : "#94a3b8"} />}>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (touched.phone) setErrors(prev => ({ ...prev, phone: validate('phone', val) }));
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, phone: true }));
                  setErrors(prev => ({ ...prev, phone: validate('phone', phone) }));
                }}
              />
            </Field>

            <Field label="Password" touched={touched.password} error={touched.password ? errors.password : null} icon={<ShieldCheck size={20} color={touched.password && errors.password ? "#ef4444" : "#94a3b8"} />}>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                secureTextEntry
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (touched.password) setErrors(prev => ({ ...prev, password: validate('password', val) }));
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, password: true }));
                  setErrors(prev => ({ ...prev, password: validate('password', password) }));
                }}
              />
            </Field>

            <Field label="Confirm Password" touched={touched.confirmPassword} error={touched.confirmPassword ? errors.confirmPassword : null} icon={<ShieldCheck size={20} color={touched.confirmPassword && errors.confirmPassword ? "#ef4444" : "#94a3b8"} />}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (touched.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: validate('confirmPassword', val) }));
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, confirmPassword: true }));
                  setErrors(prev => ({ ...prev, confirmPassword: validate('confirmPassword', confirmPassword) }));
                }}
              />
            </Field>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.signupBtnContainer}
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient 
                colors={loading || Object.values(errors).some(err => err !== null) && Object.keys(touched).length > 0 ? ['#d1d5db', '#9ca3af'] : ['#FF9900', '#FF6600']} 
                style={styles.signupBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.signupBtnText}>Create Account</Text>
                    <ArrowRight size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Small helper component ────────────────────────────────────────────────────
function Field({ label, icon, error, children, touched }: { label: string; icon: any; error?: string | null; children: any; touched?: boolean }) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {touched && error && (
          <Animated.View entering={FadeInUp} style={styles.errorContainer}>
            <Text style={styles.errorTextSmall}>{error}</Text>
          </Animated.View>
        )}
      </View>
      <View style={[
        styles.inputContainer,
        touched && error && styles.inputError,
        touched && !error && styles.inputSuccess
      ]}>
        {icon}
        {children}
        {touched && !error && (
          <Animated.View entering={ZoomIn}>
            <CheckCircle size={18} color={COLORS.primaryGreen} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Calibri',
    fontSize: 30,
    fontWeight: '800',
    color: '#1e293b',
  },
  subtitle: {
    fontFamily: 'Calibri',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },

  form: { padding: 28, marginTop: 8 },

  inputGroup: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { 
    fontFamily: 'Calibri',
    fontSize: 14, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 8 
  },
  errorTextSmall: { fontSize: 11, color: '#ef4444', fontWeight: '700' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#e2e8f0' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff1f2' },
  inputSuccess: { borderColor: COLORS.primaryGreen, backgroundColor: '#f0fdf4' },
  errorContainer: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  input: { 
    fontFamily: 'Calibri',
    flex: 1, 
    paddingVertical: 16, 
    marginLeft: 12, 
    fontSize: 15, 
    color: '#111827' 
  },

  signupBtnContainer: {
    marginTop: 24,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF7700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  signupBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  signupBtnText: { 
    fontFamily: 'Calibri',
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: '900', 
    marginRight: 10 
  },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#94a3b8' },
  link: { fontSize: 14, fontWeight: '800', color: '#FF7700' },

  // ── Success screen ──────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontFamily: 'Calibri',
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  contextCard: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  successBody: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailHighlight: {
    fontFamily: 'Calibri',
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  successNote: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  goLoginBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    marginBottom: 20,
  },
  goLoginGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  goLoginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  resendBtn: { paddingVertical: 12 },
  resendText: {
    fontSize: 14,
    color: COLORS.primaryGreen,
    fontWeight: '700',
  },
});
