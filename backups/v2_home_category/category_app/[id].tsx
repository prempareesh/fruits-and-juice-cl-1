import React, { useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ShoppingBag } from 'lucide-react-native';
import { useProducts } from '@/src/hooks/useProducts';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/src/theme/tokens';
import PremiumCard from '@/src/components/ui/PremiumCard';
import Animated, { FadeIn, FadeInUp, Layout } from 'react-native-reanimated';
import { useCartStore } from '@/src/store/useCartStore';

const { width } = Dimensions.get('window');

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, loading, refresh } = useProducts();
  const { addItem, items, removeItem } = useCartStore();

  const categoryName = useMemo(() => {
    if (!id) return 'Products';
    const name = id.charAt(0).toUpperCase() + id.slice(1);
    return name.endsWith('s') ? name : name + 's';
  }, [id]);

  const filteredProducts = useMemo(() => {
    if (!id) return [];
    const lowerId = id.toLowerCase();
    
    if (lowerId === 'trending') {
      return products.filter(p => p.is_trending || p.is_featured);
    }

    // Match 'fruit' with 'Fruits', 'vegetable' with 'Vegetables', etc.
    return products.filter(p => 
      p.category?.toLowerCase() === lowerId || 
      p.category?.toLowerCase().startsWith(lowerId.slice(0, -1)) ||
      (lowerId === 'others' && !['fruits', 'fruit', 'vegetables', 'vegetable', 'juices', 'juice'].includes(p.category?.toLowerCase() || ''))
    );
  }, [products, id]);

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isJuice = item.category?.toLowerCase().includes('juice');
    
    // Find matching items in cart
    const cartItems = items.filter(i => i.productId === item.id);
    const totalQty = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const normalQty = cartItems.filter(i => i.variantName === 'normal').reduce((acc, curr) => acc + curr.quantity, 0);
    const pureQty = cartItems.filter(i => i.variantName === 'very_pure').reduce((acc, curr) => acc + curr.quantity, 0);

    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 50).springify()} 
        layout={Layout.springify()}
        style={styles.cardContainer}
      >
        <PremiumCard 
          id={item.id}
          index={index}
          title={item.name}
          subtitle={item.quantity || (isJuice ? "300ml" : "1 Unit")}
          price={item.selling_price || item.price || 0}
          mrp={item.mrp || item.original_price}
          imageUrl={item.image_url || ''}
          category={item.category}
          onPress={() => router.push(`/product/${item.id}`)}
          onAddToCart={() => addItem(item)}
          onAddToCartVariant={(type) => {
            addItem(item, { id: type === 'normal' ? 'classic' : 'pure', variant_type: type } as any);
          }}
          onRemoveFromCart={(type) => {
            if (isJuice && type) {
              const variantId = type === 'normal' ? 'classic' : 'pure';
              removeItem(`${item.id}-${variantId}`);
            } else {
              removeItem(item.id);
            }
          }}
          cartQuantity={totalQty}
          cartQuantityVariant={{ normal: normalQty, very_pure: pureQty }}
          stock={item.stock ?? 1}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={COLORS.dark} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>{filteredProducts.length} Items Available</Text>
        </View>

        <TouchableOpacity 
          style={styles.cartBtn} 
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.7}
        >
          <ShoppingBag size={22} color={COLORS.dark} strokeWidth={2.5} />
          {items.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{items.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeIn} style={styles.emptyState}>
              <ShoppingBag size={64} color={COLORS.border} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>We are currently updating our stock for {categoryName}. Check back soon!</Text>
              <TouchableOpacity style={styles.goHomeBtn} onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.goHomeBtnText}>Go to Homepage</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cartBtn: {
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primaryGreen,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardContainer: {
    width: (width - SPACING.md * 3) / 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.dark,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  goHomeBtn: {
    marginTop: 30,
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  goHomeBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
