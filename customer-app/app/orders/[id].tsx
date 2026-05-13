import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Order, Product } from '../../src/types';
import { ChevronLeft, Download, MapPin, CreditCard, Calendar, Package, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../src/store/ThemeContext';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price_at_time: number;
  subtotal: number;
  products: Product;
}

import { useOrderTracking } from '../../src/hooks/useOrderTracking';
import { OrderTracker } from '../../src/components/OrderTracker';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const { 
    currentStatus, 
    currentStepIndex, 
    progressPercent, 
    estimatedDelivery, 
    isDelivered, 
    isCancelled,
    deliveryPartner
  } = useOrderTracking(id as string);

  useEffect(() => {
    if (id) fetchOrderDetails();
  }, [id]);

  async function fetchOrderDetails() {
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(*)')
        .eq('order_id', id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }

  const generatePDF = async () => {
    if (!order) return;
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
              <p>Order #${order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div class="order-info">
              <div>
                <strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}<br>
                <strong>Status:</strong> ${currentStatus}<br>
                <strong>Payment:</strong> ${order.payment_type.toUpperCase()}
              </div>
              <div>
                <strong>Shipping Address:</strong><br>
                ${order.address}
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
                ${items.map(item => `
                  <tr>
                    <td>${item.products?.name || 'Unknown Product'}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price_at_time || 0).toFixed(2)}</td>
                    <td>₹${(item.subtotal || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-section">
              <h3>Total Amount: ₹${order.total_amount.toFixed(2)}</h3>
            </div>
            <div class="footer">
              <p>Thank you for shopping with Juice Shop!</p>
              <p>If you have any questions, contact us at support@juiceshop.com</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generated at:', uri);
      
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Order not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order Details</Text>
        {isDelivered ? (
          <TouchableOpacity 
            style={[styles.downloadBtn, downloading && { opacity: 0.5 }]} 
            onPress={generatePDF}
            disabled={downloading}
          >
            {downloading ? <ActivityIndicator size={20} color={theme.primary} /> : <Download size={22} color={theme.primary} />}
          </TouchableOpacity>
        ) : <View style={{ width: 32 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Premium Animated Tracker */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <OrderTracker 
            currentStepIndex={currentStepIndex}
            progressPercent={progressPercent}
            estimatedDelivery={estimatedDelivery}
            currentStatus={currentStatus}
            deliveryPartner={deliveryPartner}
          />
        </Animated.View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
          <View style={styles.orderMeta}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>ID: #{order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.metaItem}>
              <CreditCard size={16} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{order.payment_type.toUpperCase()}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
        {/* Items Section */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Items Ordered</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <Text style={[styles.itemName, { color: theme.text }]}>{item.products?.name}</Text>
                  <Text style={[styles.itemSub, { color: theme.textSecondary }]}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={[styles.itemPrice, { color: theme.text }]}>₹{(item.subtotal || 0).toFixed(2)}</Text>
              </View>
              {index < items.length - 1 && <View style={[styles.divider, { backgroundColor: theme.divider }]} />}
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.divider, marginTop: 12 }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>₹{(order.total_amount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Shipping Section */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Shipping Information</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.addressRow}>
            <MapPin size={20} color={theme.primary} />
            <View style={styles.addressInfo}>
              <Text style={[styles.addressLabel, { color: theme.text }]}>Delivery Address</Text>
              <Text style={[styles.addressText, { color: theme.textSecondary }]}>{order.address}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  downloadBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusInfo: { marginLeft: 15 },
  statusLabel: { fontSize: 18, fontWeight: 'bold' },
  statusDate: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, marginLeft: 6 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  itemMain: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemSub: { fontSize: 13, marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 22, fontWeight: 'bold' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addressInfo: { marginLeft: 12, flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  addressText: { fontSize: 14, lineHeight: 20 },
});
