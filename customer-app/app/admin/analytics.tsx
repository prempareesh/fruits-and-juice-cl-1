import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    totalProducts: 0,
    totalStock: 0,
    inventoryValue: 0,
    revenueByDay: [] as { day: string, amount: number }[]
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch Orders
      const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('total_amount, created_at, user_id');

      if (oError) throw oError;

      // Calculate basic stats
      const totalRevenue = orders?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const uniqueUsers = new Set(orders?.map(o => o.user_id)).size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group revenue by day (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const revenueByDay = last7Days.map(day => {
        const amount = orders
          ?.filter(o => o.created_at.startsWith(day))
          ?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
        return { day: day.split('-').slice(1).join('/'), amount };
      });

      // Fetch Products for Inventory Stats
      const { data: products } = await supabase
        .from('products')
        .select('price, stock');

      const totalProducts = products?.length || 0;
      const totalStock = products?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0;
      const inventoryValue = products?.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0) || 0;

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueUsers,
        avgOrderValue,
        totalProducts,
        totalStock,
        inventoryValue,
        revenueByDay
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.amount), 1);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Overview of your store's performance</Text>
      </View>

      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="#10b981" 
          trend="+12.5%" 
          up={true}
        />
        <StatCard 
          title="Inventory Value" 
          value={`₹${stats.inventoryValue.toLocaleString()}`} 
          icon={TrendingUp} 
          color="#8b5cf6" 
          trend="+4.2%" 
          up={true}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          color="#3b82f6" 
          trend="+8.2%" 
          up={true}
        />
        <StatCard 
          title="Total Stock" 
          value={stats.totalStock} 
          icon={Package} 
          color="#f59e0b" 
          trend="-2.1%" 
          up={false}
        />
      </View>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Revenue (Last 7 Days)</Text>
        <View style={styles.chartContainer}>
          {stats.revenueByDay.map((d, i) => (
            <View key={i} style={styles.chartColumn}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { height: `${(d.amount / maxRevenue) * 100}%` }
                  ]} 
                />
                {d.amount > 0 && (
                  <Text style={styles.barValue}>₹{d.amount > 1000 ? (d.amount/1000).toFixed(1)+'k' : d.amount}</Text>
                )}
              </View>
              <Text style={styles.barLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        <View style={styles.insightCard}>
          <TrendingUp size={24} color="#10b981" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Sales are up!</Text>
            <Text style={styles.insightDesc}>Your revenue has increased by 12% compared to last week. Good job!</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, up }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.trendRow}>
        {up ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
        <Text style={[styles.trendText, { color: up ? '#10b981' : '#ef4444' }]}>{trend}</Text>
        <Text style={styles.trendPeriod}>vs last week</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  statCard: { width: (width - 64) / 2, backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statTitle: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginVertical: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, fontWeight: '700' },
  trendPeriod: { fontSize: 12, color: '#94a3b8' },
  chartSection: { backgroundColor: '#fff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 24 },
  chartContainer: { height: 200, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartColumn: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 160, width: 30, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  bar: { width: '100%', backgroundColor: '#10b981', borderRadius: 6, opacity: 0.8 },
  barValue: { position: 'absolute', top: -20, fontSize: 10, fontWeight: '700', color: '#64748b' },
  barLabel: { fontSize: 11, color: '#94a3b8', marginTop: 12, fontWeight: '500' },
  section: { marginBottom: 32 },
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', padding: 20, borderRadius: 20, gap: 16 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: '700', color: '#065f46' },
  insightDesc: { fontSize: 14, color: '#065f46', opacity: 0.8, marginTop: 2 }
});
