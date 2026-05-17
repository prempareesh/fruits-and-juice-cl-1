import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING } from '@/src/theme/tokens';
import PremiumCard from '../ui/PremiumCard';
import { Product } from '@/src/types';
import { ChevronRight } from 'lucide-react-native';

import { useRouter } from 'expo-router';
import { useSettings } from '@/src/hooks/useSettings';
import { useCartStore } from '@/src/store/useCartStore';

interface ProductRowProps {
  title: string;
  subtitle?: string;
  products: Product[];
  onSeeAll: () => void;
}

export const ProductRow: React.FC<ProductRowProps> = ({ 
  title, 
  subtitle, 
  products, 
  onSeeAll 
}) => {
  const { isClosed } = useSettings();
  const { addItem, removeItem, items } = useCartStore();
  const router = useRouter();

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <TouchableOpacity style={styles.seeAll} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight size={16} color={COLORS.primaryGreen} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {products.map((item, index) => {
          const cartItem = items.find(i => i.productId === item.id);
          const cartQuantity = cartItem ? cartItem.quantity : 0;

          return (
            <PremiumCard
              key={item.id}
              id={item.id}
              index={index}
              title={item.name}
              subtitle={item.quantity || "1 Unit"}
              price={item.selling_price || item.price || 0}
              mrp={item.mrp}
              imageUrl={item.image_url || ''}
              category={item.category}
              onPress={() => router.push(`/product/${item.id}`)}
              onAddToCart={() => addItem(item)}
              onRemoveFromCart={() => removeItem(item.id)}
              cartQuantity={cartQuantity}
              stock={item.stock ?? 1}
              isStoreClosed={isClosed}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  scrollContent: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
  },
});
