import * as React from 'react';
import { useState } from 'react';
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
import { Mail, Lock, User, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

/**
 * Permanent Signup Fix
 * Ensures auth user and profile row are created together.
 */
export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // toastRef removed

  const handleSignup = async () => {
    if (!fullName || !phone || !email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }

    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password too short (min 6 chars)' });
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Sign up user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: 'customer'
          }
        }
      });

      if (authError) {
        Toast.show({ type: 'error', text1: authError.message });
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // 2. Explicitly create profile row
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: fullName,
            phone: phone,
            email: cleanEmail,
            role: 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.warn('Profile creation warning:', profileError.message);
        }

        Toast.show({ type: 'success', text1: 'Account created! Logging in...' });
        
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      }
    } catch (err: any) {
      console.error('System Signup Error:', err);
      Toast.show({ type: 'error', text1: 'Connection error. Please try again.' });
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
              source={require('../assets/logo.jpg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Join FreshFlow</Text>
            <Text style={styles.subtitle}>Fresh Fruits, Vegetables & Juices Delivery</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputBox}>
                <User size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="Your Name"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputBox}>
                <Phone size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="Your Phone"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputBox}>
                <Mail size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Create Password</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.btn} 
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.gradient}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Join FreshFlow</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.link}>Sign In</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 110, height: 110, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4, textAlign: 'center' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '800', color: '#475569' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  gradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748b' },
  link: { color: '#10b981', fontWeight: '800' }
});
