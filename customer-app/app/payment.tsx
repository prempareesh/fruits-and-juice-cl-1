import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  TouchableOpacity, 
  Text, 
  Platform,
  Dimensions
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCartStore } from '../src/store/useCartStore';
import { supabase } from '../lib/supabase';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../src/theme/tokens';
import { ShieldCheck, AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react-native';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://juice-app-9uzq.onrender.com';
const BACKEND_URL = BASE_API_URL.endsWith('/api/payment') ? BASE_API_URL : `${BASE_API_URL}/api/payment`;

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { amount, name, email, contact, orderId: orderIdFromParams } = params;
  const { clearCart } = useCartStore();
  const toastRef = useRef<ToastHandle>(null);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saveError, setSaveError] = useState<{msg: string, data: any} | null>(null);

  // 1. Create Razorpay Order
  const handlePayNow = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const parsedAmount = Number(amount);
      
      const response = await axios.post(`${BACKEND_URL}/create-order`, {
        amount: parsedAmount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      }, { timeout: 30000 });

      if (response.data?.success && response.data?.order_id) {
        setOrderId(response.data.order_id);
        setShowWebView(true);
      } else {
        toastRef.current?.show('Gateway busy. Please try again.', 'error');
      }
    } catch (error: any) {
      toastRef.current?.show('Connection issue. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Finalize Order (Verification + DB Save)
  const finalizeOrder = async (razorpayData: any) => {
    setVerifying(true);
    setSaveError(null);
    
    try {
      // Step A: Cryptographic Verification via Backend
      const verifyRes = await axios.post(`${BACKEND_URL}/verify-payment`, {
        razorpay_order_id: razorpayData.razorpay_order_id,
        razorpay_payment_id: razorpayData.razorpay_payment_id,
        razorpay_signature: razorpayData.razorpay_signature,
      }, { timeout: 30000 });

      if (!verifyRes.data || !verifyRes.data.success) {
        throw new Error('Signature verification failed');
      }

      // Step B: Update Existing Order Status with Payment Details
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'received',
          payment_status: 'paid',
          razorpay_order_id: razorpayData.razorpay_order_id,
          razorpay_payment_id: razorpayData.razorpay_payment_id,
          razorpay_signature: razorpayData.razorpay_signature
        })
        .eq('id', orderIdFromParams);
      
      if (updateError) throw updateError;

      const finalOrderId = orderIdFromParams as string;

      // SUCCESS: Clear cart and redirect
      clearCart();
      router.replace({
        pathname: '/(tabs)/orders',
        params: { success: 'true', orderId: finalOrderId }
      });

    } catch (err: any) {
      console.error("[Payment] Atomicity failure:", err.message);
      setSaveError({ msg: err.message, data: razorpayData });
    } finally {
      setVerifying(false);
    }
  };

  const onMessage = (event: any) => {
    setShowWebView(false);
    try {
      const data = typeof event.nativeEvent.data === 'string' 
        ? JSON.parse(event.nativeEvent.data) 
        : event.nativeEvent.data;
      
      const message = data.data || data;

      if (data.status === 'success') {
        finalizeOrder(message);
      } else if (data.status === 'cancelled') {
        toastRef.current?.show('Payment cancelled.', 'info');
      } else {
        toastRef.current?.show(data.message || 'Payment failed.', 'error');
      }
    } catch (e) {
      console.error("[Payment] Message error:", e);
      toastRef.current?.show('Invalid gateway response.', 'error');
    }
  };

  // Web Listener
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (e: MessageEvent) => {
        try {
          const message = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (message.status) onMessage({ nativeEvent: { data: JSON.stringify(message) } } as any);
        } catch (err) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  if (verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.verifyTitle}>Verifying Payment...</Text>
          <Text style={styles.verifySubtitle}>Please do not close the app or refresh.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (saveError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Animated.View entering={ZoomIn}>
            <AlertCircle size={80} color="#ef4444" />
          </Animated.View>
          <Text style={[styles.title, { color: '#ef4444', marginTop: 20 }]}>Action Required</Text>
          <Text style={styles.errorText}>Payment succeeded but we couldn't save your order due to a network glitch.</Text>
          <Text style={styles.errorSub}>Payment ID: {saveError.data?.razorpay_payment_id}</Text>
          
          <TouchableOpacity style={styles.retryBtn} onPress={() => finalizeOrder(saveError.data)}>
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.retryBtnText}>Retry Saving Order</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showWebView && orderId) {
    const checkoutUrl = `${BACKEND_URL}/checkout/${orderId}?amount=${Number(amount) * 100}&name=${encodeURIComponent(name as string)}&email=${encodeURIComponent(email as string)}&contact=${encodeURIComponent(contact as string)}`;
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity onPress={() => setShowWebView(false)}>
            <ChevronLeft size={24} color={COLORS.darkText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <View style={{ width: 24 }} />
        </View>
        {Platform.OS === 'web' ? (
          <iframe src={checkoutUrl} style={styles.iframe} title="Payment" />
        ) : (
          <WebView 
            source={{ uri: checkoutUrl }} 
            onMessage={onMessage}
            startInLoadingState 
            renderLoading={() => <ActivityIndicator size="large" color={COLORS.primaryGreen} style={StyleSheet.absoluteFill} />}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Toast ref={toastRef} />
      <View style={styles.main}>
        <Animated.View entering={FadeInUp.delay(200)}>
          <View style={styles.iconBox}>
            <ShieldCheck size={48} color={COLORS.primaryGreen} />
          </View>
          <Text style={styles.title}>Secure Payment</Text>
          <Text style={styles.subtitle}>Verify details and proceed to pay</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Payable Amount</Text>
          <Text style={styles.amountValue}>₹{amount}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Razorpay Secure</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)} style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payBtn, loading && { opacity: 0.7 }]} 
            onPress={handlePayNow}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Proceed to Pay ₹{amount}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  main: { flex: 1, padding: 32, justifyContent: 'center' },
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  title: { ...TYPOGRAPHY.h1, textAlign: 'center', color: COLORS.darkText },
  subtitle: { ...TYPOGRAPHY.subtext, textAlign: 'center', marginBottom: 40 },
  amountCard: { backgroundColor: '#f8fafc', padding: 40, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  amountLabel: { fontSize: 14, color: COLORS.mutedGray, fontWeight: '600', marginBottom: 8 },
  amountValue: { fontSize: 48, fontWeight: '900', color: COLORS.primaryGreen },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 16 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#166534', textTransform: 'uppercase' },
  footer: { marginTop: 60 },
  payBtn: { backgroundColor: COLORS.primaryGreen, paddingVertical: 20, borderRadius: 20, alignItems: 'center', elevation: 8, shadowColor: COLORS.primaryGreen, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { marginTop: 20, padding: 10, alignItems: 'center' },
  backBtnText: { color: COLORS.mutedGray, fontWeight: '600' },
  verifyTitle: { ...TYPOGRAPHY.h2, marginTop: 24 },
  verifySubtitle: { color: COLORS.mutedGray, marginTop: 8 },
  errorText: { fontSize: 16, color: COLORS.darkText, textAlign: 'center', marginTop: 16, lineHeight: 24 },
  errorSub: { fontSize: 12, color: COLORS.mutedGray, marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  retryBtn: { flexDirection: 'row', gap: 10, backgroundColor: '#1e293b', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, marginTop: 32, alignItems: 'center' },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },
  webViewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkText },
  iframe: { width: '100%', height: '100%', borderWidth: 0 },
});
