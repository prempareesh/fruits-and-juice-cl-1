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
import { ShoppingBag, ChevronRight, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/store/ThemeContext';

export default function OrdersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <ShoppingBag size={64} color={theme.divider} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>When you place an order, it will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order History</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Your recent purchases and their status</Text>
      </View>
      <View style={styles.list}>
        {orders.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/orders/${order.id}`)}
          >
            <View style={[styles.orderHeader, { borderBottomColor: theme.divider }]}>
              <View>
                <Text style={[styles.orderId, { color: theme.text }]}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
                  {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={[styles.itemSummary, { backgroundColor: theme.background }]}>
              <Clock size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.itemSummaryText, { color: theme.textSecondary }]}>Items details available in full receipt</Text>
            </View>

            <View style={styles.orderFooter}>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Total Amount</Text>
                <Text style={[styles.priceValue, { color: theme.text }]}>₹{order.total_amount.toFixed(2)}</Text>
              </View>
              <View style={styles.detailsBtn}>
                <Text style={styles.detailsText}>View Details</Text>
                <ChevronRight size={16} color={theme.primary} />
              </View>
            </View>
          </TouchableOpacity>
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
});
