import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Alert, 
  Platform 
} from 'react-native';
import { Search, Plus, Package, Edit2, Trash2, RefreshCcw, Upload, TrendingDown, AlertTriangle, Boxes } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInLeft, Layout } from 'react-native-reanimated';
import { AdminProductModal } from '../../src/components/admin/AdminProductModal';
import { BulkUploadModal } from '../../src/components/admin/BulkUploadModal';
import { useAdminProducts } from '../../src/hooks/useAdminProducts';
import { AdminProductService } from '../../src/services/AdminProductService';

export default function AdminProducts() {
  const { products, setProducts, loading, refresh, stats } = useAdminProducts();
  const { initialFilter } = useLocalSearchParams<{ initialFilter?: string }>();
  const [activeCategory, setActiveCategory] = useState<string>(initialFilter || 'All');
  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialFilter) {
      setActiveCategory(initialFilter);
    }
  }, [initialFilter]);

  const handleDelete = async (id: string) => {
    console.log(`[Admin_Delete] User initiated delete for: ${id}`);
    
    const performDelete = async () => {
      try {
        console.log(`[Admin_Delete] Starting atomic deletion for ${id}...`);
        setDeletingIds(prev => new Set(prev).add(id));
        
        // Optimistic UI Update
        setProducts(prev => prev.filter(p => p.id !== id));
        
        await AdminProductService.deleteProduct(id);
        
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log(`[Admin_Delete] Successfully confirmed deletion of ${id}`);
      } catch (err: any) {
        console.error(`[Admin_Delete] CRITICAL FAILURE for ${id}:`, err);
        await refresh(); 
        const errorMessage = err.message || 'The server rejected the deletion.';
        const isSetupRequired = errorMessage.includes('SYSTEM_SETUP_REQUIRED');
        const isConstraint = errorMessage.includes('linked to existing orders');
        
        if (Platform.OS === 'web' && isSetupRequired) {
          window.alert(errorMessage);
        } else {
          Alert.alert(
            isSetupRequired ? 'System Setup Required' : (isConstraint ? 'Cannot Delete Ordered Product' : 'Delete Failed'),
            isSetupRequired 
              ? 'You must run the SQL script in "scripts/delete_product_rpc.sql" once in your Supabase dashboard to enable spontaneous deletions.'
              : (isConstraint 
                  ? 'This product has already been purchased in past orders. Please set its stock to 0 instead.'
                  : `Error: ${errorMessage}`)
          );
        }
      } finally {
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to delete this product? This will also remove it from order history.");
      if (confirmed) await performDelete();
    } else {
      Alert.alert(
        "Delete Product",
        "This will permanently remove the product from the catalog. This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>{stats.totalProducts} products in stock</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsBulkModalVisible(true)}>
            <Upload size={18} color="#10b981" />
            <Text style={styles.secondaryBtnText}>Bulk Import</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => {
              setSelectedProduct(null);
              setIsModalVisible(true);
            }}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Boxes size={16} color="#64748b" />
          <Text style={styles.statLabel}>Value: </Text>
          <Text style={styles.statValue}>₹{stats.inventoryValue.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <TrendingDown size={16} color="#f59e0b" />
          <Text style={styles.statLabel}>Low Stock: </Text>
          <Text style={styles.statValue}>{stats.lowStockCount}</Text>
        </View>
        <View style={styles.statItem}>
          <AlertTriangle size={16} color="#ef4444" />
          <Text style={styles.statLabel}>Out: </Text>
          <Text style={styles.statValue}>{stats.outOfStockCount}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search inventory..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity onPress={refresh}>
          <RefreshCcw size={18} color="#10b981" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
          {['All', 'Fruits', 'Vegetables', 'Juices', 'Others'].map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 3 }]}>Product Details</Text>
            <Text style={[styles.headerText, { flex: 1.5 }]}>Category</Text>
            <Text style={[styles.headerText, { flex: 1.5 }]}>Pricing</Text>
            <Text style={[styles.headerText, { flex: 1.5 }]}>Stock</Text>
            <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Actions</Text>
          </View>

          {filteredProducts.map((product, idx) => (
            <Animated.View 
              key={product.id} 
              entering={FadeInLeft.delay(idx * 30)}
              layout={Layout.springify()}
              style={styles.row}
            >
              <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                <Image source={{ uri: product.image_url || 'https://via.placeholder.com/150' }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productQty}>{product.quantity}</Text>
                </View>
              </View>
              <View style={[styles.cell, { flex: 1.5 }]}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{product.category}</Text>
                </View>
              </View>
              <View style={[styles.cell, { flex: 1.5 }]}>
                <Text style={styles.priceText}>₹{product.price}</Text>
                {!!product.discount_percent && (
                  <Text style={styles.discountText}>{product.discount_percent}% OFF</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 1.5 }]}>
                <Text style={[
                  styles.stockText,
                  product.stock <= 0 ? styles.stockOut : product.stock < 10 ? styles.stockLow : null
                ]}>
                  {product.stock <= 0 ? 'Out of Stock' : `${product.stock} items`}
                </Text>
              </View>
              <View style={[styles.cell, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }]}>
                <TouchableOpacity 
                  onPress={() => { setSelectedProduct(product); setIsModalVisible(true); }}
                  disabled={deletingIds.has(product.id)}
                >
                  <Edit2 size={18} color={deletingIds.has(product.id) ? "#cbd5e1" : "#64748b"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDelete(product.id)}
                  disabled={deletingIds.has(product.id)}
                >
                  {deletingIds.has(product.id) ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Trash2 size={18} color="#ef4444" />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <AdminProductModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSuccess={() => {
          refresh();
          setIsModalVisible(false);
        }} 
        product={selectedProduct}
      />
      <BulkUploadModal 
        visible={isBulkModalVisible} 
        onClose={() => setIsBulkModalVisible(false)} 
        onSuccess={() => {}} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#10b981' },
  secondaryBtnText: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  statsBar: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 20, backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  statValue: { fontSize: 12, color: '#1e293b', fontWeight: '800' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 24, marginBottom: 24, paddingHorizontal: 16, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  content: { flex: 1, paddingHorizontal: 24 },
  table: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 40 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerText: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  cell: { paddingRight: 8 },
  productImage: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9' },
  productInfo: { marginLeft: 12, flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  productQty: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  priceText: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  discountText: { fontSize: 10, fontWeight: '800', color: '#ef4444', marginTop: 2 },
  stockText: { fontSize: 13, fontWeight: '700', color: '#10b981' },
  stockLow: { color: '#f59e0b' },
  stockOut: { color: '#ef4444' },
  categoriesBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  categoriesContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  categoryTabActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  categoryTabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  categoryTabTextActive: { color: '#fff' },
});
