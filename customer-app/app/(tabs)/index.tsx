import * as React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/theme/tokens';
import { Header } from '../../src/components/Header';
import { HeroBanner } from '../../src/components/HeroBanner';
import { CategoryPill } from '../../src/components/CategoryPill';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { SearchBar } from '../../src/components/SearchBar';
import { DestinationCard } from '../../src/components/ui/card';
import { Toast, ToastHandle } from '../../src/components/ui/Toast';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { useProducts } from '../../src/hooks/useProducts';
import { analytics } from '../../src/services/AnalyticsService';
import { ShoppingBag } from 'lucide-react-native';
import { useDebounce } from '../../src/hooks/useDebounce';
import { Product } from '../../src/types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCartStore } from '../../src/store/useCartStore';
import { ProductService } from '../../src/services/ProductService';
import { Apple, Bean, Cherry, Citrus, Grape, Leaf, Filter, X, ChevronDown, Flame } from 'lucide-react-native';
import Slideshow from '../../src/components/ui/slideshow';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Citrus size={24} /> },
  { id: 'fruit', label: 'Fruits', icon: <Apple size={24} /> },
  { id: 'juice', label: 'Juices', icon: <Bean size={24} /> },
  { id: 'organic', label: 'Organic', icon: <Leaf size={24} /> },
];

export default function HomeScreen() {
  const router = useRouter();
  const { category: paramCategory } = useLocalSearchParams<{ category: string }>();
  const addItem = useCartStore((state) => state.addItem);
  const toastRef = useRef<ToastHandle>(null);
  const { products, loading, refreshing, error, hasMore, loadMore, refresh, retry } = useProducts();
  const [activeCategory, setActiveCategory] = useState('all');
  
  const { width: windowWidth } = useWindowDimensions();
  const numColumns = windowWidth > 1024 ? 4 : windowWidth > 768 ? 3 : 2;
  const gridGap = 16;
  const cardWidth = (windowWidth - 40 - (gridGap * (numColumns - 1))) / numColumns;

  useEffect(() => {
    if (paramCategory) {
      setActiveCategory(paramCategory);
    }
  }, [paramCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  
  // Filter states
  const [filterVisible, setFilterVisible] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(500);
  const [selectedSort, setSelectedSort] = useState<'none' | 'price_low' | 'price_high' | 'popular'>('popular');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCategory = activeCategory === 'all' || 
                             p.category?.toLowerCase() === activeCategory.toLowerCase();
      
      const matchesSearch = !debouncedSearch || 
                           p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                           p.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
                           
      const price = p.price || p.price_per_kg || 0;
      const matchesPrice = price <= priceRange;

      return matchesCategory && matchesSearch && matchesPrice;
    });

    if (selectedSort === 'price_low') {
      result.sort((a, b) => (a.price || a.price_per_kg || 0) - (b.price || b.price_per_kg || 0));
    } else if (selectedSort === 'price_high') {
      result.sort((a, b) => (b.price || b.price_per_kg || 0) - (a.price || a.price_per_kg || 0));
    } else if (selectedSort === 'popular') {
      // Mock popularity logic: Juices first, then by name
      result.sort((a, b) => {
        if (a.category === 'juice' && b.category !== 'juice') return -1;
        if (a.category !== 'juice' && b.category === 'juice') return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [products, activeCategory, debouncedSearch, priceRange, selectedSort]);

  const handleAddToCart = (item: Product) => {
    addItem(item);
    toastRef.current?.show(`${item.name} added to your basket! 🧺`, 'success');
  };

  const renderSkeleton = () => (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonLoader width="100%" height={180} borderRadius={28} />
          <View style={{ marginTop: 12, gap: 8 }}>
            <SkeletonLoader width="70%" height={20} />
            <SkeletonLoader width="40%" height={15} />
          </View>
        </View>
      ))}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />
      <OfflineBanner />
      <Toast ref={toastRef} />
      
      <SearchBar 
        value={searchQuery} 
        onChangeText={setSearchQuery} 
        onClear={() => setSearchQuery('')}
        onFilterPress={() => setFilterVisible(true)}
      />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onRefresh={refresh}
        refreshing={refreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={8}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          <>
            <Slideshow />
            <HeroBanner />
            <View style={styles.promoSection}>
               <LinearGradient
                 colors={['#FFECD2', '#FCB69F']}
                 style={styles.promoCard}
                 start={{x: 0, y: 0}}
                 end={{x: 1, y: 1}}
               >
                 <View>
                   <Text style={styles.promoTitle}>Super Fresh Sale!</Text>
                   <Text style={styles.promoSubtitle}>Get up to 30% off on all juices</Text>
                 </View>
                 <Flame color="#FF512F" size={32} />
               </LinearGradient>
            </View>

            <View style={styles.categoryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                {CATEGORIES.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    label={cat.label}
                    icon={cat.icon ? React.cloneElement(cat.icon as React.ReactElement, { 
                      color: activeCategory === cat.id ? COLORS.white : COLORS.darkText 
                    }) : null}
                    active={activeCategory === cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionHeader}>
              <View style={{ paddingHorizontal: 20, marginVertical: 16 }}>
                <Text style={TYPOGRAPHY.h2}>
                  {activeCategory === 'all' ? 'Popular Items' : `${activeCategory.charAt(0).toUpperCase()}${activeCategory.slice(1)}s`}
                </Text>
                <Text style={styles.subtitleText}>Hand-picked freshness for you</Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={{ width: cardWidth, marginHorizontal: 8, marginBottom: 16 }}>
            <PremiumCard
              id={item.id}
              index={index}
              title={item.name}
              subtitle={item.description}
              price={ProductService.getPrice(item)}
              imageUrl={ProductService.getOptimizedImage(item.image_url, 400)}
              category={item.category}
              isAvailable={item.is_available}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              onAddToCart={() => handleAddToCart(item)}
            />
          </View>
        )}
        ListEmptyComponent={loading ? renderSkeleton() : (
          <EmptyState 
            icon={ShoppingBag} 
            title="No matches found" 
            subtitle="Try adjusting your filters or search query." 
            actionLabel="View All Products"
            onAction={() => setActiveCategory('all')}
          />
        )}
        ListFooterComponent={hasMore && products.length > 0 ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator color={COLORS.primaryGreen} />
          </View>
        ) : null}
      />

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <View style={styles.modalHeader}>
              <Text style={TYPOGRAPHY.h2}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <X size={24} color={COLORS.darkText} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {[
                  { id: 'popular', label: 'Most Popular' },
                  { id: 'price_low', label: 'Lowest Price' },
                  { id: 'price_high', label: 'Highest Price' },
                ].map(opt => (
                  <TouchableOpacity 
                    key={opt.id}
                    style={[styles.sortBtn, selectedSort === opt.id && styles.sortBtnActive]}
                    onPress={() => setSelectedSort(opt.id as any)}
                  >
                    <Text style={[styles.sortText, selectedSort === opt.id && styles.sortTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Max Price: ₹{priceRange}</Text>
              <View style={styles.priceGrid}>
                {[100, 200, 300, 500].map(max => (
                  <TouchableOpacity 
                    key={max}
                    style={[styles.priceBtn, priceRange === max && styles.priceBtnActive]}
                    onPress={() => setPriceRange(max)}
                  >
                    <Text style={[styles.priceText, priceRange === max && styles.priceTextActive]}>
                      ₹{max}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyBtn}
              onPress={() => setFilterVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Show Results</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.creamBackground,
    alignItems: 'center' 
  },
  scrollContent: { 
    width: '100%',
    maxWidth: 1200, // Maximum width for Laptop screens
    paddingBottom: 40,
  },
  promoSection: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  promoCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  promoTitle: { fontSize: 20, fontWeight: '900', color: COLORS.darkText },
  promoSubtitle: { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginTop: 4, fontWeight: '600' },
  categoryContainer: { backgroundColor: COLORS.creamBackground, paddingVertical: 10 },
  categoryList: { paddingHorizontal: SPACING.md },
  section: { marginTop: SPACING.md },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    paddingHorizontal: SPACING.md, 
    marginBottom: SPACING.lg 
  },
  subtitleText: { fontSize: 13, color: COLORS.mutedGray, marginTop: 2, fontWeight: '500' },
  sortBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.1)'
  },
  sortBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primaryGreen },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', // Center cards on web
    paddingHorizontal: SPACING.md,
    gap: 16
  },
  skeletonCard: { width: '48%', marginBottom: SPACING.xl },
  errorContainer: { alignItems: 'center', padding: 40, marginTop: 40 },
  errorText: { fontSize: 15, color: COLORS.mutedGray, marginTop: 12, textAlign: 'center' },
  retryButton: { marginTop: 20, backgroundColor: COLORS.white, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primaryGreen },
  retryText: { color: COLORS.primaryGreen, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 60, marginTop: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.darkText, marginTop: 16 },
  emptySubtitle: { fontSize: 15, color: COLORS.mutedGray, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  resetButton: { 
    marginTop: 28, 
    backgroundColor: COLORS.primaryGreen, 
    paddingHorizontal: 28, 
    paddingVertical: 14, 
    borderRadius: 18,
    shadowColor: COLORS.primaryGreen,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4
  },
  resetText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.xl 
  },
  filterSection: { marginBottom: 32 },
  filterLabel: { fontSize: 17, fontWeight: '900', color: COLORS.darkText, marginBottom: 18 },
  sortOptions: { gap: 12 },
  sortBtn: { padding: 18, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
  sortBtnActive: { backgroundColor: '#F0FDF4', borderColor: COLORS.primaryGreen },
  sortText: { fontSize: 15, fontWeight: '700', color: COLORS.darkText },
  sortTextActive: { color: COLORS.primaryGreen },
  priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  priceBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 16, 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  priceBtnActive: { backgroundColor: '#FFF7ED', borderColor: COLORS.primaryOrange },
  priceText: { fontSize: 14, fontWeight: '700', color: COLORS.darkText },
  priceTextActive: { color: COLORS.primaryOrange },
  applyBtn: { 
    backgroundColor: COLORS.primaryGreen, 
    paddingVertical: 20, 
    borderRadius: 22, 
    alignItems: 'center',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  applyBtnText: { color: COLORS.white, fontSize: 18, fontWeight: '900' }
});
