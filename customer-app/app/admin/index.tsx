import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, TrendingUp, Users, Package, AlertCircle, Clock, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function AdminDashboardHome() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    customers: 0,
    products: 0,
    pendingDeliveries: 0,
    outOfStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // REALTIME LISTENERS
    const ordersChannel = supabase
      .channel('dashboard_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const productsChannel = supabase
      .channel('dashboard_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch Orders for stats and recent list
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Fetch Profiles (Customers)
      const { count: customerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');
        
      // Fetch Products
      const { data: products } = await supabase
        .from('products')
        .select('id, stock');

      if (orders && products) {
        const revenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const pending = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
        const outOfStock = products.filter(p => p.stock <= 0).length;

        setStats({
          totalOrders: orders.length,
          revenue,
          customers: customerCount || 0,
          products: products.length,
          pendingDeliveries: pending,
          outOfStock,
        });

        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bg, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Overview</Text>
        <Text style={styles.subtitle}>Welcome back, here's what's happening today.</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={TrendingUp} color="#10b981" bg="#ecfdf5" onPress={() => router.push('/admin/analytics')} />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="#3b82f6" bg="#eff6ff" onPress={() => router.push('/admin/orders')} />
        <StatCard title="Total Customers" value={stats.customers} icon={Users} color="#8b5cf6" bg="#f5f3ff" onPress={() => router.push('/admin/customers')} />
        <StatCard title="Total Products" value={stats.products} icon={Package} color="#f59e0b" bg="#fffbeb" onPress={() => router.push('/admin/products')} />
        <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={Clock} color="#06b6d4" bg="#ecfeff" onPress={() => router.push('/admin/orders')} />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={AlertCircle} color="#ef4444" bg="#fef2f2" onPress={() => router.push('/admin/inventory')} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/admin/orders')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.card}>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No recent orders</Text>
          ) : (
            recentOrders.map((order, index) => (
              <TouchableOpacity 
                key={order.id} 
                style={[styles.orderRow, index === recentOrders.length - 1 && styles.lastRow]}
                onPress={() => router.push('/admin/orders')}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderId}>#{order.id.substring(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderTime}>{format(new Date(order.created_at), 'MMM dd, hh:mm a')}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>₹{order.total_amount}</Text>
                  <View style={[styles.badge, order.status === 'DELIVERED' ? styles.badgeSuccess : styles.badgeWarning]}>
                    <Text style={[styles.badgeText, order.status === 'DELIVERED' ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#94a3b8" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, gap: 24 },
  header: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: { 
    flex: 1, 
    minWidth: 200, 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  statInfo: { flex: 1 },
  statTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  emptyText: { padding: 24, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  lastRow: { borderBottomWidth: 0 },
  orderLeft: { flex: 1 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  orderTime: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  orderRight: { alignItems: 'flex-end' },
  orderAmount: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeSuccess: { backgroundColor: '#ecfdf5' },
  badgeWarning: { backgroundColor: '#fffbeb' },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeTextSuccess: { color: '#10b981' },
  badgeTextWarning: { color: '#f59e0b' }
});
