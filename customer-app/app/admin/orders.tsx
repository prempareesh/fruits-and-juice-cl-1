import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Search, Filter, MoreHorizontal, Clock, ShoppingBag, ChevronRight } from 'lucide-react-native';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { AdminOrderModal } from '../../src/components/admin/AdminOrderModal';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openOrder = (order: any) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    (o.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'CANCELLED': return '#ef4444';
      case 'PREPARING': return '#3b82f6';
      case 'OUT_FOR_DELIVERY': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Manage and process customer orders</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by Order ID or Customer Name..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ padding: 24, paddingTop: 0 }}>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.row, styles.tableHeader]}>
              <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Order ID</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Customer</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Date</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>Total</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>Status</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.5, textAlign: 'right' }]}></Text>
            </View>

            {/* Body */}
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <ShoppingBag size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No orders found</Text>
              </View>
            ) : (
              filteredOrders.map((order, idx) => (
                <Animated.View 
                  key={order.id} 
                  entering={FadeInUp.delay(idx * 40).springify()}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity 
                    style={[styles.row, idx === filteredOrders.length - 1 && styles.lastRow]}
                    onPress={() => openOrder(order)}
                  >
                    <View style={[styles.cell, { flex: 2 }]}>
                      <Text style={styles.orderId}>#{order.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 2 }]}>
                      <Text style={styles.customerName}>{order.profiles?.full_name || 'Guest'}</Text>
                      <Text style={styles.customerPhone}>{order.profiles?.phone || 'No phone'}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 2 }]}>
                      <Text style={styles.dateText}>{format(new Date(order.created_at), 'MMM dd, yyyy')}</Text>
                      <Text style={styles.timeText}>{format(new Date(order.created_at), 'hh:mm a')}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1.5 }]}>
                      <Text style={styles.amountText}>₹{order.total_amount}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1.5 }]}>
                      <View style={[styles.badge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(order.status) }]}>
                          {order.status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cell, { flex: 0.5, alignItems: 'flex-end' }]}>
                      <ChevronRight size={20} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <AdminOrderModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        order={selectedOrder}
        onStatusUpdate={fetchOrders}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  btnTextSecondary: { fontSize: 14, fontWeight: '600', color: '#475569' },
  searchContainer: { marginHorizontal: 24, marginBottom: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1 },
  table: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  row: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  tableHeader: { backgroundColor: '#f8fafc', paddingVertical: 12 },
  lastRow: { borderBottomWidth: 0 },
  cell: { paddingRight: 8 },
  headerCell: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  customerName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  customerPhone: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  dateText: { fontSize: 14, fontWeight: '500', color: '#334155' },
  timeText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  amountText: { fontSize: 15, fontWeight: '700', color: '#10b981' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  badgeSuccess: { backgroundColor: '#ecfdf5' },
  badgeWarning: { backgroundColor: '#fffbeb' },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeTextSuccess: { color: '#10b981' },
  badgeTextWarning: { color: '#f59e0b' },
  moreBtn: { padding: 4 },
  emptyState: { padding: 48, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#94a3b8' }
});
