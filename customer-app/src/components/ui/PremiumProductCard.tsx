import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Plus, Minus, Star } from 'lucide-react-native';
import { COLORS } from '@/src/theme/tokens';
import { useCartStore } from '@/src/store/useCartStore';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  image_url: string;
  quantity?: string;
  stock?: number;
  is_featured?: boolean;
  isStoreClosed?: boolean;
}

export const PremiumProductCard = (product: ProductCardProps) => {
  const { addItem, removeItem, items } = useCartStore();
  const cartItem = items.find(i => i.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const isOutOfStock = product.stock === 0;
  const isDisabled = product.isStoreClosed || isOutOfStock;

  const discount = product.discount_percent || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0);

  return (
    <Animated.View entering={FadeIn} style={[styles.card, product.isStoreClosed && styles.cardClosed]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={styles.imageContainer}
        disabled={product.isStoreClosed}
      >
        <Image 
          source={{ uri: product.image_url }} 
          style={[styles.image, (product.isStoreClosed || isOutOfStock) && styles.imageDisabled]} 
          resizeMode="cover" 
        />
        
        {discount > 0 && !isOutOfStock && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <View style={styles.ratingRow}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>4.5</Text>
        </View>
        
        <Text style={[styles.name, isDisabled && styles.textDisabled]} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.weight}>{product.quantity || '1 unit'}</Text>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, isDisabled && styles.textDisabled]}>₹{product.price}</Text>
            {product.original_price && product.original_price > product.price && (
              <Text style={styles.originalPrice}>₹{product.original_price}</Text>
            )}
          </View>

          {quantityInCart > 0 && !product.isStoreClosed ? (
            <Animated.View entering={ZoomIn} style={styles.quantitySelector}>
              <TouchableOpacity onPress={() => removeItem(product.id)} style={styles.qBtn}>
                <Minus size={14} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.qText}>{quantityInCart}</Text>
              <TouchableOpacity 
                onPress={() => addItem(product as any)} 
                style={styles.qBtn}
                disabled={quantityInCart >= (product.stock || 99)}
              >
                <Plus size={14} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.addBtn, 
                isDisabled && styles.addBtnDisabled
              ]} 
              onPress={() => addItem(product as any)}
              disabled={isDisabled}
            >
              <Text style={[styles.addBtnText, isDisabled && styles.textDisabled]}>
                {isOutOfStock ? 'OUT' : 'ADD'}
              </Text>
              {!isOutOfStock && <Plus size={14} color={product.isStoreClosed ? "#94a3b8" : "#2E7D32"} strokeWidth={3} />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginRight: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardClosed: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDisabled: {
    opacity: 0.5,
    tintColor: 'gray',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  info: {
    padding: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  weight: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '600',
  },
  textDisabled: {
    color: '#94a3b8',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  originalPrice: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginTop: -2,
  },
  addBtn: {
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E7D32',
    gap: 4,
  },
  addBtnDisabled: {
    opacity: 0.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  addBtnText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '900',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 2,
    gap: 8,
  },
  qBtn: {
    padding: 4,
  },
  qText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    minWidth: 16,
    textAlign: 'center',
  },
});
