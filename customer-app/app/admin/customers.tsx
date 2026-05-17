import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Image,
  SafeAreaView
} from 'react-native';
import { 
  Users, 
  Search, 
  ChevronRight, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Calendar,
  IndianRupee,
  User as UserIcon
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface CustomerProfile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  role?: string | null;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Fetch profiles with order stats using a join or multiple queries
      // For simplicity and performance, we'll fetch profiles and then aggregate orders
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      const { data: orderStats, error: statsError } = await supabase
        .from('orders')
        .select('user_id, total_amount');

      if (statsError) throw statsError;

      // Aggregate stats
      const statsMap = (orderStats || []).reduce((acc: any, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = { count: 0, total: 0 };
        }
        acc[order.user_id].count += 1;
        acc[order.user_id].total += (order.total_amount || 0);
        return acc;
      }, {});

      const processedCustomers = (profiles || []).map(profile => ({
        ...profile,
        order_count: statsMap[profile.id]?.count || 0,
        total_spent: statsMap[profile.id]?.total || 0,
      }));

      setCustomers(processedCustomers);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.phone?.includes(searchQuery) || 
     c.id.includes(searchQuery))
  );

  const renderCustomerCard = ({ item, index }: { item: CustomerProfile, index: number }) => (
    <Animated.View 
      entering={FadeInRight.delay(index * 100)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <UserIcon size={24} color="#10b981" />
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.customerName}>{item.full_name || 'Guest User'}</Text>
          <Text style={styles.customerId}>ID: #{item.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#fef2f2' : '#f0fdf4' }]}>
          <Text style={[styles.roleText, { color: item.role === 'admin' ? '#ef4444' : '#10b981' }]}>
            {item.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ShoppingBag size={14} color="#64748b" />
          <Text style={styles.statLabel}>Orders</Text>
          <Text style={styles.statValue}>{item.order_count}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <IndianRupee size={14} color="#64748b" />
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={styles.statValue}>₹{item.total_spent.toFixed(0)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Calendar size={14} color="#64748b" />
          <Text style={styles.statLabel}>Joined</Text>
          <Text style={styles.statValue}>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Phone size={14} color="#94a3b8" />
          <Text style={styles.contactText}>{item.phone || 'No phone'}</Text>
        </View>
        {item.address && (
          <View style={styles.contactItem}>
            <MapPin size={14} color="#94a3b8" />
            <Text style={styles.contactText} numberOfLines={1}>{item.address}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Customer Directory</Text>
          <Text style={styles.subtitle}>{customers.length} users registered</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by name, phone or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            setRefreshing(true);
            fetchCustomers();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={64} color="#e2e8f0" />
              <Text style={styles.emptyTitle}>No Customers Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    marginHorizontal: 24, 
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  listContent: { padding: 24, paddingTop: 0 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  nameContainer: { flex: 1, marginLeft: 16 },
  customerName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  customerId: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 10, fontWeight: '900' },
  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  divider: { width: 1, height: 24, backgroundColor: '#e2e8f0' },
  contactInfo: { gap: 10 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' }
});
