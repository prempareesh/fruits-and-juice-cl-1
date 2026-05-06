import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Alert,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../src/store/useCartStore';
import { Trash2, Plus, Minus, ChevronRight, ShoppingBag, CreditCard, Banknote, CheckCircle2, Download, Eye, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Toast, ToastHandle } from '../../src/components/ui/Toast';
import { ProductService } from '../../src/services/ProductService';
import AddressPicker, { AddressData } from '../../src/components/AddressPicker';
import { EmptyState } from '../../src/components/ui/EmptyState';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const { items, removeItem, updateQuantity, getTotal, placeOrder, clearCart } = useCartStore();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const toastRef = React.useRef<ToastHandle>(null);

  const handleAddressSelect = React.useCallback((addr: AddressData) => {
    console.log("[Cart] Address selected:", addr.formattedAddress);
    setSelectedAddress(addr);
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      console.log("[Checkout] Initiating checkout process...");
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.warn("[Checkout] Auth failure:", error?.message);
        toastRef.current?.show('Please login to place an order.', 'error');
        setLoading(false);
        return;
      }

      // 1. Validate Address (with fallback formatting)
      let effectiveAddress = selectedAddress?.formattedAddress;
      
      if (!effectiveAddress && selectedAddress) {
        const parts = [selectedAddress.street, selectedAddress.locality, selectedAddress.city].filter(Boolean);
        effectiveAddress = parts.join(', ');
      }

      if (!effectiveAddress || effectiveAddress.trim().length < 5) {
        toastRef.current?.show(
          !selectedAddress ? "Please select a delivery address." : "Address is too short.", 
          'error'
        );
        setLoading(false);
        return;
      }

      console.log("[Checkout] Validated Address:", effectiveAddress);

      const totalAmount = getTotal();
      if (totalAmount <= 0) {
        Alert.alert('Invalid Cart', 'Your cart is empty.');
        return;
      }

      console.log("[Checkout] Validation passed. Method:", paymentMethod);

      if (paymentMethod === 'online') {
        const orderId = await placeOrder(user.id, effectiveAddress, 'online', 'pending_payment'); 
        
        if (!orderId) {
          setLoading(false);
          return;
        }

        router.push({
          pathname: '/payment',
          params: {
            amount: totalAmount,
            orderId: orderId, // Pass the newly created order ID
            name: user.user_metadata?.full_name || 'Customer',
            email: user.email || '',
            contact: user.user_metadata?.phone || '',
          }
        });
      } else {
        await processOrder(user.id, 'COD_PENDING', effectiveAddress);
      }
    } catch (err: any) {
      console.error("[Checkout] Critical error:", err.message);
      toastRef.current?.show("Something went wrong. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const processOrder = async (userId: string, paymentId: string, addressOverride?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalAddress = addressOverride || selectedAddress?.formattedAddress || user?.user_metadata?.permanent_address || 'Default Address, Hyderabad';
      
      console.log("[Checkout] Processing order for user:", userId, "Address:", finalAddress);
      
      const orderId = await placeOrder(userId, finalAddress, paymentMethod);
      
      if (orderId) {
        setLastOrder({
          id: orderId,
          items: [...items],
          total: getTotal(),
          date: new Date().toLocaleString(),
          paymentId,
          paymentMethod: paymentMethod === 'online' ? 'Online (UPI)' : 'Cash on Delivery',
          address: finalAddress
        });
        setShowReceipt(true);
      } else {
        Alert.alert('Order Failed', 'We couldn\'t save your order. Please check your connection.');
      }
    } catch (err: any) {
      console.error("[Checkout] processOrder error:", err.message);
      Alert.alert('Error', 'An unexpected error occurred while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!lastOrder) return;
    setDownloading(true);
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #FF7700; padding-bottom: 20px; }
              .order-info { margin: 30px 0; display: flex; justify-content: space-between; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th { text-align: left; background-color: #f8fafc; padding: 12px; border-bottom: 1px solid #e2e8f0; }
              .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
              .total-section { margin-top: 30px; text-align: right; }
              .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Juice Shop Receipt</h1>
              <p>Order #${lastOrder.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div class="order-info">
              <div>
                <strong>Date:</strong> ${lastOrder.date}<br>
                <strong>Payment:</strong> ${lastOrder.paymentMethod}<br>
                <strong>Transaction ID:</strong> ${lastOrder.paymentId}
              </div>
              <div>
                <strong>Shipping Address:</strong><br>
                ${lastOrder.address}
              </div>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${lastOrder.items.map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${item.subtotal.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-section">
              <h3>Total Amount: ₹${lastOrder.total.toFixed(2)}</h3>
            </div>
            <div class="footer">
              <p>Thank you for shopping with Juice Shop!</p>
              <p>If you have any questions, contact us at support@juiceshop.com</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Success', 'PDF generated! (Sharing is only available on mobile)');
      }
    } catch (error) {
      console.error('PDF Error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    clearCart();
    router.replace('/(tabs)/orders');
  };

  if (items.length === 0 && !showReceipt) {
    return (
      <EmptyState 
        icon={ShoppingBag}
        title="Your cart is feeling light"
        subtitle="Looks like you haven't added any fresh harvest yet. Start your journey to health today!"
        actionLabel="Start Shopping"
        onAction={() => router.replace('/(tabs)')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Toast ref={toastRef} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.itemList}>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image 
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=200' }} 
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemVariant}>
                  {item.category === 'juice' ? `${item.variantName === 'very_pure' ? 'Very Pure' : 'Normal'} • 300ml` : `Fresh • Per kg`}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>{ProductService.formatPrice(item.subtotal)}</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity 
                      style={styles.qtyBtn} 
                      onPress={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={16} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>
                      {item.category === 'fruit' ? `${item.quantity}kg` : item.quantity}
                    </Text>
                    <TouchableOpacity 
                      style={styles.qtyBtn} 
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={16} color="#1e293b" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <AddressPicker 
            onAddressSelect={handleAddressSelect}
            initialAddress={selectedAddress || { formattedAddress: lastOrder?.address }}
          />
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'online' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('online')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#eff6ff' }]}>
              <CreditCard size={20} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLabel}>Online Payment</Text>
              <Text style={styles.paymentDesc}>Pay via GPay, PhonePe, or any UPI app</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'online' && styles.radioSelected]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#f0fdf4' }]}>
              <Banknote size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLabel}>Cash on Delivery</Text>
              <Text style={styles.paymentDesc}>Pay in cash when your order arrives</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioSelected]} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{ProductService.formatPrice(getTotal())}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹0.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{ProductService.formatPrice(getTotal())}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, loading && { opacity: 0.7 }]} 
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.checkoutBtnText}>
            {loading ? 'Processing...' : `Proceed to Pay ${ProductService.formatPrice(getTotal())}`}
          </Text>
          {!loading && <ChevronRight size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showReceipt}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptContainer}>
            <LinearGradient
              colors={['#4ADE80', '#22C55E']}
              style={styles.receiptHeader}
            >
              <CheckCircle2 size={48} color="#FFFFFF" />
              <Text style={styles.receiptStatus}>Payment Successful!</Text>
              <Text style={styles.receiptId}>Order #{lastOrder?.id?.slice(0, 8).toUpperCase()}</Text>
            </LinearGradient>

            <ScrollView style={styles.receiptContent} showsVerticalScrollIndicator={false}>
              <View style={styles.receiptSection}>
                <Text style={styles.receiptLabel}>Transaction Details</Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Date</Text>
                  <Text style={styles.receiptRowValue}>{lastOrder?.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Payment ID</Text>
                  <Text style={styles.receiptRowValue}>{lastOrder?.paymentId?.slice(0, 15)}...</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Method</Text>
                  <Text style={styles.receiptRowValue}>{lastOrder?.paymentMethod}</Text>
                </View>
              </View>

              <View style={styles.receiptSection}>
                <Text style={styles.receiptLabel}>Items Purchased</Text>
                {lastOrder?.items.map((item: any) => (
                  <View key={item.id} style={styles.receiptItem}>
                    <Text style={styles.receiptItemName}>{item.name} x {item.quantity}</Text>
                    <Text style={styles.receiptItemPrice}>₹{item.subtotal.toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.receiptTotal}>
                <Text style={styles.receiptTotalLabel}>Total Amount Paid</Text>
                <Text style={styles.receiptTotalValue}>₹{lastOrder?.total.toFixed(2)}</Text>
              </View>
            </ScrollView>

            <View style={styles.receiptFooter}>
              <View style={styles.receiptActions}>
                <TouchableOpacity style={styles.receiptActionBtn} onPress={() => router.push(`/orders/${lastOrder?.id}`)}>
                  <Eye size={20} color="#64748b" />
                  <Text style={styles.receiptActionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.receiptActionBtn, downloading && { opacity: 0.5 }]} 
                  onPress={generatePDF}
                  disabled={downloading}
                >
                  {downloading ? <ActivityIndicator size={20} color="#64748b" /> : <Download size={20} color="#64748b" />}
                  <Text style={styles.receiptActionText}>Download</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.doneBtn} onPress={handleReceiptClose}>
                <Text style={styles.doneBtnText}>Back to Orders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FFFFFF' },
  emptyIconContainer: { width: 120, height: 120, backgroundColor: '#FFF8E7', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  browseButton: { backgroundColor: '#3A8C3F', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  browseButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  itemList: { padding: 20 },
  cartItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f8fafc' },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  itemVariant: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#3A8C3F' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, padding: 4 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', paddingHorizontal: 8 },
  removeBtn: { padding: 8 },
  paymentSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  paymentOptionSelected: { borderColor: '#3A8C3F', backgroundColor: '#F0FDF4' },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  paymentLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  paymentDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', marginLeft: 12 },
  radioSelected: { borderColor: '#3A8C3F', backgroundColor: '#3A8C3F', borderWidth: 5 },
  summaryContainer: { backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: 8 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#64748b' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#3A8C3F' },
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: '#FFFFFF' },
  checkoutBtn: { backgroundColor: '#3A8C3F', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 20, shadowColor: '#3A8C3F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  receiptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  receiptContainer: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 30, overflow: 'hidden', maxHeight: '85%' },
  receiptHeader: { padding: 32, alignItems: 'center' },
  receiptStatus: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  receiptId: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  receiptContent: { padding: 24 },
  receiptSection: { marginBottom: 24 },
  receiptLabel: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptRowLabel: { fontSize: 14, color: '#64748b' },
  receiptRowValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  receiptItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  receiptItemName: { fontSize: 15, color: '#1e293b', flex: 1 },
  receiptItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  receiptTotal: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  receiptTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  receiptTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#3A8C3F' },
  receiptFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  receiptActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  receiptActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  receiptActionText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#64748b' },
  doneBtn: { backgroundColor: '#1e293b', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  addressSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
