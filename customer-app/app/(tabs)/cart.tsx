import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '@/src/store/useCartStore';
import { Trash2, Plus, Minus, ChevronRight, ShoppingBag, CreditCard, Banknote, Phone, Mail, MapPin, Tag, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/providers/AuthProvider';
import { ProductService } from '../../src/services/ProductService';
import AddressPicker, { AddressData } from '../../src/components/AddressPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { NotificationService } from '../../src/services/NotificationService';
import { OrderTrackingService } from '../../src/services/orderTrackingService';
import { COLORS } from '../../src/theme/colors';

export default function CartScreen() {
  const { 
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getGrandTotal,
    deliveryFee,
    placeOrder,
    clearCart,
    selectedAddress,
    isServiceable,
    isCheckingRadius,
    setSelectedAddress,
    distance,
    minOrderAmount,
  } = useCartStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isCODModalVisible, setCODModalVisible] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile) {
      if (profile.phone && !phoneNumber) setPhoneNumber(profile.phone);
      if (profile.full_name && !fullName) setFullName(profile.full_name);
      if (user?.email && !email) setEmail(user.email);
    }
  }, [profile, user]);

  const handleAddressSelect = React.useCallback(async (addr: AddressData) => {
    try {
      await setSelectedAddress(addr);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    }
  }, [setSelectedAddress]);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      // 1. Validation
      if (!fullName || !phoneNumber) {
        Toast.show({ type: 'error', text1: 'Please fill in your name and phone number.' });
        setLoading(false);
        return;
      }

      // 2. Stock Validation
      const { validateCartStock } = useCartStore.getState();
      const isStockValid = await validateCartStock();
      if (!isStockValid) {
        setLoading(false);
        return;
      }

      const grandTotal = getGrandTotal();
      if (grandTotal <= 0) {
        Alert.alert('Empty Cart', 'Please add items to your cart.');
        setLoading(false);
        return;
      }

      // 3. Payment Method Logic
      if (paymentMethod === 'cod') {
        setCODModalVisible(true);
        setLoading(false);
      } else {
        // ONLINE FLOW: Redirect to payment screen with full context
        // We do NOT create the order in DB yet (as requested)
        router.push({
          pathname: '/payment',
          params: { 
            amount: grandTotal, 
            name: fullName, 
            email: user?.email || '', 
            contact: phoneNumber,
            address: selectedAddress?.formattedAddress || '',
            lat: selectedAddress?.latitude || 0,
            lng: selectedAddress?.longitude || 0,
            userId: user?.id || ''
          }
        });
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Cart_Checkout_Error]', err);
      Alert.alert("Checkout Error", err.message || "Failed to initialize checkout.");
      setLoading(false);
    }
  };

  const proceedToOrder = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error("Authentication required. Please login again.");

      const orderId = await placeOrder(
        user.id, 
        selectedAddress!.formattedAddress, 
        'cod', 
        'PENDING', 
        selectedAddress || undefined,
        fullName || user.user_metadata?.full_name || 'User',
        phoneNumber
      );

      if (orderId) {
        Toast.show({ type: 'success', text1: 'Order Placed Successfully!' });
        router.replace({ pathname: '/success', params: { orderId } } as any);
        setTimeout(() => {
          clearCart();
        }, 100);
      }
    } catch (err: any) {
      console.error('[Cart_Order_Error]', err);
      Alert.alert("Order Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState 
        icon={ShoppingBag}
        title="Your basket is empty"
        subtitle="Explore our fresh harvest and start shopping."
        actionLabel="Go Shopping"
        onAction={() => router.replace('/(tabs)')}
      />
    );
  }

  const itemTotal = getTotal();
  // As per production requirements, no platform fee or extra taxes are added.
  const finalPayable = itemTotal + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Basket ({items.length} {items.length === 1 ? 'item' : 'items'})</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Address & Delivery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={COLORS.primaryGreen} />
            <Text style={styles.sectionTitle}>Delivery at</Text>
            {isCheckingRadius && <ActivityIndicator size="small" color={COLORS.primaryGreen} style={{ marginLeft: 'auto' }} />}
          </View>
          <View style={styles.addressContainer}>
            <AddressPicker 
              onAddressSelect={handleAddressSelect}
              initialAddress={selectedAddress || { formattedAddress: '' }}
            />
          </View>
        </View>

        {/* Contact Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={18} color={COLORS.primaryGreen} />
            <Text style={styles.sectionTitle}>Contact for delivery</Text>
          </View>
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#94A3B8"
          />
          <TextInput
            style={styles.input}
            placeholder="WhatsApp Number for tracking"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Cart Items Section */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Fresh Harvest Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImageBg}>
                <Image source={{ uri: item.image }} style={styles.itemImg} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}{item.variantName ? ` (${item.variantName === 'very_pure' ? 'Pure' : 'Classic'})` : ''}
                </Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              <View style={styles.stepperContainer}>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.stepBtn}>
                  <Minus size={14} color="#FFF" strokeWidth={3} />
                </TouchableOpacity>
                <Text style={styles.qtyCount}>{item.quantity}</Text>
                <TouchableOpacity 
                  onPress={() => updateQuantity(item.id, item.quantity + 1)} 
                  style={[styles.stepBtn, item.quantity >= item.stock && { opacity: 0.5 }]}
                  disabled={item.quantity >= item.stock}
                >
                  <Plus size={14} color="#FFF" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentGrid}>
            <TouchableOpacity 
              style={[styles.payOption, paymentMethod === 'online' && styles.payOptionActive]} 
              onPress={() => setPaymentMethod('online')}
            >
              <CreditCard size={20} color={paymentMethod === 'online' ? COLORS.primaryGreen : '#64748B'} />
              <Text style={[styles.payText, paymentMethod === 'online' && styles.payTextActive]}>Pay Online</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.payOption, paymentMethod === 'cod' && styles.payOptionActive]} 
              onPress={() => setPaymentMethod('cod')}
            >
              <Banknote size={20} color={paymentMethod === 'cod' ? COLORS.primaryGreen : '#64748B'} />
              <Text style={[styles.payText, paymentMethod === 'cod' && styles.payTextActive]}>Cash on Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <View style={styles.labelGroup}>
              <ShoppingBag size={14} color="#64748B" />
              <Text style={styles.billLabel}>Item Total</Text>
            </View>
            <Text style={styles.billValue}>₹{itemTotal.toFixed(0)}</Text>
          </View>

          <View style={styles.billRow}>
            <View style={styles.labelGroup}>
              <MapPin size={14} color="#64748B" />
              <Text style={styles.billLabel}>Delivery Fee</Text>
            </View>
            <Text style={[styles.billValue, { color: COLORS.primaryGreen }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          {distance > 0 && (
            <View style={[styles.logisticsInfo, !isServiceable && styles.outOfRangeBg]}>
              <View style={[styles.statusDot, { backgroundColor: !isServiceable ? '#ef4444' : COLORS.primaryGreen }]} />
              <Text style={[styles.distanceText, !isServiceable && { color: '#ef4444' }]}>
                {!isServiceable 
                  ? `Out of Delivery Range (${distance.toFixed(1)} km)` 
                  : `Distance: ${distance.toFixed(1)} km`
                }
              </Text>
              {isServiceable && (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.radiusText}>Serviceable Area</Text>
                </>
              )}
            </View>
          )}

          {getTotal() < minOrderAmount && (
            <Animated.View entering={FadeIn} style={styles.minOrderWarning}>
              <AlertCircle size={18} color="#ef4444" />
              <Text style={styles.minOrderText}>
                Minimum order of ₹{minOrderAmount} required. Add ₹{minOrderAmount - getTotal()} more!
              </Text>
            </Animated.View>
          )}

          <View style={styles.divider} />
          <View style={[styles.billRow, { marginTop: 4 }]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{finalPayable.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.disclaimerContainer}>
          <Tag size={12} color="#94A3B8" />
          <Text style={styles.disclaimerText}>By proceeding, you agree to our terms of service.</Text>
        </View>

      </ScrollView>

      {/* Sticky Checkout Bar */}
      <View style={[
        styles.stickyFooter, 
        { 
          bottom: Platform.OS === 'web' ? 65 : (Platform.OS === 'ios' ? 85 + insets.bottom : 85)
        }
      ]}>
        <View style={styles.footerPriceInfo}>
          <Text style={styles.totalPrice}>₹{finalPayable.toFixed(0)}</Text>
          <Text style={styles.viewDetailedBill} onPress={() => {}}>View Details</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.checkoutBtn, 
            (loading || !isServiceable || !selectedAddress || getTotal() < minOrderAmount) && styles.btnDisabled,
            (!isServiceable || getTotal() < minOrderAmount) && { backgroundColor: '#94A3B8' }
          ]} 
          onPress={handleCheckout}
          disabled={loading || !isServiceable || !selectedAddress || getTotal() < minOrderAmount}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>
            {loading ? 'Processing...' : 'Place Order'}
          </Text>
          {!loading && <ChevronRight size={20} color="#FFF" strokeWidth={3} />}
        </TouchableOpacity>
      </View>

      {/* COD Confirmation Modal */}
      <Modal
        visible={isCODModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCODModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.codIconBg}>
                <Banknote size={32} color={COLORS.primaryGreen} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Confirm COD Order</Text>
                <Text style={styles.modalSubtitle}>Pay with cash upon delivery</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{items.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Address</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>{selectedAddress?.formattedAddress}</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 12, paddingTop: 12 }]}>
                <Text style={styles.totalLabel}>Amount to Pay</Text>
                <Text style={styles.totalValue}>₹{finalPayable.toFixed(0)}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setCODModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Change Method</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]} 
                onPress={() => {
                  setCODModalVisible(false);
                  proceedToOrder();
                }}
              >
                <Text style={styles.confirmBtnText}>Confirm Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', 
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  scrollContent: { paddingBottom: 140 },
  section: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  addressContainer: { marginTop: 4 },
  input: { backgroundColor: '#F1F5F9', height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 14, color: '#1E293B', fontWeight: '600' },
  itemsSection: { marginHorizontal: 16, marginTop: 24 },
  itemsTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 12, marginLeft: 4 },
  itemCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
    padding: 12, borderRadius: 16, marginBottom: 12, elevation: 1 
  },
  itemImageBg: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  itemImg: { width: 45, height: 45, resizeMode: 'contain' },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  itemPrice: { fontSize: 14, color: '#3A8C3F', fontWeight: '800', marginTop: 2 },
  stepperContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryGreen, 
    borderRadius: 12, height: 36, paddingHorizontal: 4 
  },
  stepBtn: { padding: 6 },
  qtyCount: { color: '#FFF', fontSize: 14, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  paymentGrid: { flexDirection: 'row', gap: 12, marginTop: 8 },
  payOption: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, 
    borderRadius: 12, borderWidth: 1.5, borderColor: '#F1F5F9' 
  },
  payOptionActive: { borderColor: COLORS.primaryGreen, backgroundColor: '#F0FDF4' },
  payText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  payTextActive: { color: COLORS.primaryGreen },
  billCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 24, padding: 20, borderRadius: 20 },
  billTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  billLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  billValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  grandTotalLabel: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  grandTotalValue: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  logisticsInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0FDF4', 
    padding: 12, 
    borderRadius: 16, 
    marginTop: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  outOfRangeBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distanceText: { fontSize: 13, fontWeight: '800', color: COLORS.primaryGreen },
  radiusText: { fontSize: 13, fontWeight: '600', color: '#166534' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primaryGreen, opacity: 0.3 },
  disclaimerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  disclaimerText: { fontSize: 11, color: '#94A3B8' },
  stickyFooter: { 
    position: 'absolute', 
    bottom: Platform.OS === 'web' ? 65 : 85, 
    width: '100%', 
    backgroundColor: '#FFF', 
    padding: 20, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 20,
    zIndex: 999,
  },
  footerPriceInfo: { flex: 1 },
  totalPrice: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  viewDetailedBill: { fontSize: 12, color: COLORS.primaryGreen, fontWeight: '700', marginTop: 2 },
  minOrderWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 8,
  },
  minOrderText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '700',
  },
  checkoutBtn: { 
    backgroundColor: COLORS.primaryGreen, flexDirection: 'row', alignItems: 'center', 
    gap: 8, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, elevation: 4 
  },
  checkoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  btnDisabled: { opacity: 0.7, backgroundColor: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 32 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  codIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  modalSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  summaryCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#F1F5F9' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1, textAlign: 'right', marginLeft: 20 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  totalValue: { fontSize: 24, fontWeight: '900', color: COLORS.primaryGreen },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  confirmBtn: { backgroundColor: COLORS.primaryGreen },
  cancelBtnText: { color: '#64748B', fontWeight: '800', fontSize: 15 },
  confirmBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
});
