import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  Image,
  Platform
} from 'react-native';
import { Search, Filter, AlertTriangle, CheckCircle, Package, ArrowRight, RefreshCcw } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AdminInventory() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All'); // All, In Stock, Low Stock, Out of Stock

  useEffect(() => {
    fetchInventory();

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Realtime inventory update:', payload);
        fetchInventory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Inventory Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Out of Stock', color: '#ef4444', bg: '#fef2f2' };
    if (stock <= 10) return { label: 'Low Stock', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'In Stock', color: '#10b981', bg: '#f0fdf4' };
  };
  
  const handleUpdateStock = async (id: string, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    try {
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { error } = await supabase
        .from('products')
        .update({ stock: finalStock })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state for instant feedback
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: finalStock } : p));
    } catch (error) {
      console.error('Update Stock Error:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStockStatus(p.stock).label;
    const matchesFilter = filter === 'All' || status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: products.length,
    low: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    out: products.filter(p => p.stock <= 0).length
  };

  const renderProduct = ({ item, index }: { item: any, index: number }) => {
    const status = getStockStatus(item.stock);
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50)}
        style={styles.productCard}
      >
        <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.productImage} />
        <View style={styles.productMeta}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category} • {item.quantity}</Text>
        </View>
        <View style={styles.stockInfo}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.stockCount}>{item.stock} items</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickBtn} 
              onPress={() => handleUpdateStock(item.id, item.stock - 10)}
            >
              <Text style={styles.quickBtnText}>-10</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickBtn, styles.quickBtnAdd]} 
              onPress={() => handleUpdateStock(item.id, item.stock + 10)}
            >
              <Text style={[styles.quickBtnText, styles.quickBtnTextAdd]}>+10</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Real-time stock monitoring</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchInventory}>
          <RefreshCcw size={20} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.statsScrollContent}
        >
          <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
            <Package size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
            <AlertTriangle size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.low}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
            <AlertTriangle size={20} color="#ef4444" />
            <Text style={styles.statValue}>{stats.out}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </ScrollView>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchBar}>
        <Search size={20} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filters}>
        {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Package size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20 
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  refreshBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statsContainer: {
    height: 150, // Fixed height for the entire stats row
    marginBottom: 16,
    zIndex: 1,
  },
  statsScrollContent: { 
    paddingHorizontal: 20,
    paddingVertical: 10, // Added vertical padding to contain shadows/borders
    gap: 12,
  },
  statCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginRight: 12, 
    width: 140, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderLeftWidth: 4,
    justifyContent: 'center'
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    height: 52, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    marginHorizontal: 20,
    marginBottom: 16 
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1e293b' },
  filters: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    paddingHorizontal: 20,
    marginBottom: 20 
  },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  productCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    minHeight: 100
  },
  productImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#f1f5f9' },
  productMeta: { flex: 1, marginLeft: 15, paddingRight: 10 },
  productName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  productCategory: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  stockInfo: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 110 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 6 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  stockCount: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickBtn: { backgroundColor: '#f1f5f9', width: 40, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  quickBtnAdd: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  quickBtnText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  quickBtnTextAdd: { color: '#10b981' },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600' }
});
