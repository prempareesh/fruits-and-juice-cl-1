import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/src/theme/tokens';
import PremiumCard from '../ui/PremiumCard';
import { Product } from '@/src/types';
import { ChevronRight, PackageOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '@/src/hooks/useSettings';
import { useCartStore } from '@/src/store/useCartStore';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ProductSectionProps {
  title: string;
  products: Product[];
  onSeeAll?: () => void;
  horizontal?: boolean;
  emptyState?: {
    title: string;
    subtitle: string;
  };
}

export const ProductSection: React.FC<ProductSectionProps> = ({ 
  title, 
  products, 
  onSeeAll,
  horizontal = true,
  emptyState
}) => {
  const { isClosed } = useSettings();
  const { addItem, removeItem, items } = useCartStore();
  const router = useRouter();

  if (products.length === 0) {
    if (!emptyState) return null;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <PackageOpen size={48} color={COLORS.border} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{emptyState.title}</Text>
          <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
        </View>
      </View>
    );
  }

  // Pre-calculate cart quantities for O(1) lookup in the loop
  const cartMap = useMemo(() => {
    const map: Record<string, { total: number; normal: number; very_pure: number }> = {};
    items.forEach(item => {
      if (!map[item.productId]) {
        map[item.productId] = { total: 0, normal: 0, very_pure: 0 };
      }
      map[item.productId].total += item.quantity;
      if (item.variantName === 'normal') map[item.productId].normal += item.quantity;
      if (item.variantName === 'very_pure') map[item.productId].very_pure += item.quantity;
    });
    return map;
  }, [items]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity style={styles.seeAll} onPress={onSeeAll} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight size={16} color={COLORS.primaryGreen} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.scrollContent : styles.gridContent}
        decelerationRate="fast"
      >
        {products.map((item, index) => {
          const cartData = cartMap[item.id] || { total: 0, normal: 0, very_pure: 0 };
          const isJuice = item.category?.toLowerCase().includes('juice');

          return (
            <View key={item.id} style={horizontal ? styles.cardMargin : styles.gridCard}>
              <PremiumCard
                id={item.id}
                index={index}
                title={item.name}
                subtitle={item.quantity || (isJuice ? "300ml" : "1 Unit")}
                price={item.selling_price || item.price || 0}
                mrp={item.original_price || item.mrp}
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
                cartQuantity={cartData.total}
                cartQuantityVariant={{ normal: cartData.normal, very_pure: cartData.very_pure }}
                stock={item.stock ?? 1}
                isStoreClosed={isClosed}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.dark,
    letterSpacing: 0.2,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryGreenLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  scrollContent: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
  },
  gridContent: {
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardMargin: {
    marginRight: 0, // PremiumCard already has margin
  },
  gridCard: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
