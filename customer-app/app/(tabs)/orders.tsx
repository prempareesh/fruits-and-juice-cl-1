import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Order } from '../../src/types';
import { ShoppingBag, ChevronRight, Clock, MapPin, Package } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/theme/colors';
import { Image } from 'react-native';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // ── Realtime subscription ───────────────────────────────────────────
    let channel: any;
    
    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`public_orders_user_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchOrders(true);
          }
        )
        .subscribe();
    }

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders(isBackground = false) {
    try {
      if (!isBackground) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('[Orders_Fetch_Error]', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case 'PENDING': return '#94a3b8';
      case 'CONFIRMED': return '#3b82f6';
      case 'PREPARING': return '#8b5cf6';
      case 'PACKED': return '#f59e0b';
      case 'OUT_FOR_DELIVERY': return '#6366f1';
      case 'DELIVERED': return '#10b981';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      case 'RECEIVED': return '#3b82f6'; // Legacy support
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: COLORS.white }]}>
        <ShoppingBag size={64} color={COLORS.border} />
        <Text style={[styles.emptyTitle, { color: COLORS.dark }]}>No orders yet</Text>
        <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>When you place an order, it will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: COLORS.white }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: COLORS.white }]}>
        <Text style={[styles.headerTitle, { color: COLORS.dark }]}>Order History</Text>
        <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>Your recent purchases and their status</Text>
      </View>
      <View style={styles.list}>
        {orders.map((order) => (
          <View 
            key={order.id} 
            style={[styles.orderCard, { backgroundColor: COLORS.white, borderColor: COLORS.border }]}
          >
            <View style={[styles.orderHeader, { borderBottomColor: COLORS.border }]}>
              <View>
                <Text style={[styles.orderId, { color: COLORS.dark }]}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={[styles.orderDate, { color: COLORS.textSecondary }]}>
                  {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.itemsPreview}>
              {order.order_items && order.order_items.length > 0 ? (
                <View style={styles.imageRow}>
                  {order.order_items.slice(0, 3).map((item: any, idx: number) => (
                    <View key={idx} style={styles.productImageBox}>
                      <Image 
                        source={{ uri: item.products?.image_url || 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=150' }} 
                        style={styles.productImage}
                      />
                    </View>
                  ))}
                  {order.order_items.length > 3 && (
                    <View style={[styles.productImageBox, styles.moreItemsBox]}>
                      <Text style={styles.moreItemsText}>+{order.order_items.length - 3}</Text>
                    </View>
                  )}
                  <View style={styles.itemsTextContainer}>
                    <Text style={styles.itemsText} numberOfLines={1}>
                      {order.order_items.map((i: any) => i.products?.name).join(', ')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.itemSummary, { backgroundColor: COLORS.background }]}>
                  <Package size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.itemSummaryText, { color: COLORS.textSecondary }]}>Items details not available</Text>
                </View>
              )}
            </View>

            <View style={[styles.orderMetaRow, { borderBottomColor: COLORS.border }]}>
              <Text style={styles.metaLabel}>Payment: <Text style={styles.metaValue}>{order.payment_type?.toUpperCase() || 'ONLINE'}</Text></Text>
              <Text style={styles.metaLabel}>Total: <Text style={[styles.metaValue, { color: COLORS.primaryGreen }]}>₹{order.total_amount?.toFixed(2)}</Text></Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.push(`/orders/${order.id}`)}>
                <Text style={styles.actionBtnTextPrimary}>View Order Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  list: { padding: 20, paddingTop: 8 },
  itemSummary: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 10, borderRadius: 10 },
  itemSummaryText: { fontSize: 13 },
  orderCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, paddingBottom: 16, marginBottom: 16 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  orderDate: { fontSize: 12, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 12 },
  priceValue: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { fontSize: 14, color: '#FF7700', fontWeight: '600', marginRight: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  itemsPreview: { marginVertical: 12 },
  imageRow: { flexDirection: 'row', alignItems: 'center' },
  productImageBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f8fafc', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  moreItemsBox: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  moreItemsText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  itemsTextContainer: { flex: 1, marginLeft: 8 },
  itemsText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  orderMetaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, marginBottom: 12 },
  metaLabel: { fontSize: 12, color: '#64748b' },
  metaValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  actionBtnTextSecondary: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  actionBtnPrimary: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primaryGreen, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtnTextPrimary: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
