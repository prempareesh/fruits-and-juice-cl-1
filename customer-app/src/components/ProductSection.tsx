import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';
import PremiumCard from './ui/PremiumCard';
import { Product } from '../types';
import { ProductService } from '../services/ProductService';
import { useRouter } from 'expo-router';
import { ChevronRight, ShoppingBag, ShoppingCart } from 'lucide-react-native';
import { useCartStore } from '../store/useCartStore';
import { scale, moderateScale, SCREEN_WIDTH } from '../utils/responsive';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSeeAll?: () => void;
  autoScroll?: boolean;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  subtitle,
  products,
  onAddToCart,
  onSeeAll,
  autoScroll = false,
}) => {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <TouchableOpacity 
          style={styles.seeAll}
          onPress={onSeeAll}
          activeOpacity={0.6}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={moderateScale(14)} color={COLORS.primaryGreen} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={scale(160) + 12}
        snapToAlignment="start"
      >
        {products.map((item, index) => {
          const cartItem = items.find(ci => ci.productId === item.id);
          const cartQuantity = cartItem?.quantity || 0;

          const handleAddToCart = () => {
            if (cartQuantity === 0) {
              addItem(item, undefined, 1);
            } else {
              updateQuantity(cartItem!.id, cartQuantity + 1);
            }
          };

          const handleRemoveFromCart = () => {
            if (cartQuantity > 1) {
              updateQuantity(cartItem!.id, cartQuantity - 1);
            } else {
              removeItem(cartItem!.id);
            }
          };

          return (
            <View key={`${item.id}-${index}`} style={styles.cardWrapper}>
              <PremiumCard
                id={item.id}
                index={index}
                title={item.name}
                subtitle={item.description}
                price={ProductService.getPrice(item)}
                mrp={item.mrp}
                imageUrl={ProductService.getOptimizedImage(item.image_url, 400)}
                category={item.category}
                stock={item.is_available ? 99 : 0}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                cartQuantity={cartQuantity}
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
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },
  subtitle: {
    fontFamily: '"Inter", sans-serif',
    fontSize: 13,
    color: COLORS.mutedGray,
    marginTop: 4,
    fontWeight: '500',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: COLORS.primaryGreen,
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  cardWrapper: {
    width: 170,
  },
});
