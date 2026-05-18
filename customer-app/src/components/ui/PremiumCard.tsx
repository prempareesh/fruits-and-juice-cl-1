import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Platform,
  Image as RNImage,
  TouchableOpacity,
} from 'react-native';
import { ProductService } from '../../services/ProductService';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/tokens';
import { ShoppingBag, Plus, Minus, Clock } from 'lucide-react-native';
import { getProductImageSource } from '../../utils/imageUtils';

interface PremiumCardProps {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  price: number;
  mrp?: number;
  imageUrl: string;
  category?: string;
  onPress: () => void;
  onAddToCart?: () => void;
  onRemoveFromCart?: (variant?: 'normal' | 'very_pure') => void;
  cartQuantity?: number;
  stock?: number;
  isStoreClosed?: boolean;
  onAddToCartVariant?: (variant: 'normal' | 'very_pure') => void;
  cartQuantityVariant?: { normal: number; very_pure: number };
}

export const SafeProductImage = React.memo(({ 
  name, category, imageUrl, style 
}: { name: string; category: string; imageUrl: string; style?: any }) => {
  const [errored, setErrored] = useState(false);
  const source = getProductImageSource(name, category, errored ? undefined : imageUrl);

  return (
    <View style={[styles.imageContainer, style]}>
      <RNImage
        source={source}
        style={[StyleSheet.absoluteFill, { resizeMode: 'contain' }]}
        onError={() => setErrored(true)}
      />
      {errored && (
        <View style={styles.errorOverlay}>
          <ShoppingBag size={24} color={COLORS.muted} />
        </View>
      )}
    </View>
  );
});

const PremiumCard: React.FC<PremiumCardProps> = ({
  title,
  subtitle,
  price,
  mrp,
  imageUrl,
  category,
  onPress,
  onAddToCart,
  onRemoveFromCart,
  cartQuantity = 0,
  stock = 1,
  isStoreClosed = false,
  onAddToCartVariant,
  cartQuantityVariant = { normal: 0, very_pure: 0 }
}) => {
  const [selectedJuiceType, setSelectedJuiceType] = useState<'normal' | 'very_pure'>('normal');
  const isJuice = category?.toLowerCase().includes('juice');
  
  const currentPrice = isJuice && selectedJuiceType === 'very_pure' ? price * 2 : price;
  const currentMrp = isJuice && selectedJuiceType === 'very_pure' ? (mrp ? mrp * 2 : currentPrice + 20) : mrp;
  
  const discount = currentMrp && currentPrice < currentMrp ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const isOutOfStock = stock <= 0;
  const isDisabled = isStoreClosed || isOutOfStock;

  const currentCartQty = isJuice ? (selectedJuiceType === 'normal' ? cartQuantityVariant.normal : cartQuantityVariant.very_pure) : cartQuantity;

  return (
    <View style={styles.cardContainer}>
      <Pressable 
        onPress={onPress}
        disabled={isStoreClosed}
        style={({ pressed }) => [
          styles.card,
          isStoreClosed && styles.cardDisabled,
          pressed && !isStoreClosed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        {/* Discount Badge */}
        {discount > 0 && !isOutOfStock && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {/* Heart icon removed per request */}

        {/* Image Section */}
        <View style={styles.imageWrapper}>
          <SafeProductImage
            name={title}
            category={category || 'fruit'}
            imageUrl={ProductService.getOptimizedImage(imageUrl, 400)}
            style={[styles.image, isDisabled && styles.imageGrey]}
          />
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Delivery Badge */}
        {!isStoreClosed && !isOutOfStock && (
          <View style={styles.timeBadge}>
            <Clock size={10} color={COLORS.primaryGreen} strokeWidth={3} />
            <Text style={styles.timeText}>15 MINS</Text>
          </View>
        )}

        {/* Content Section */}
        <View style={styles.content}>
          <View>
            <Text style={[styles.title, isDisabled && styles.textMuted]} numberOfLines={2}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle || '500g'}</Text>
          </View>

          {isJuice && !isOutOfStock && (
            <View style={styles.variantPicker}>
              <TouchableOpacity 
                style={[styles.variantTab, selectedJuiceType === 'normal' && styles.variantTabActive]}
                onPress={(e) => { e.stopPropagation(); setSelectedJuiceType('normal'); }}
              >
                <Text style={[styles.variantTabText, selectedJuiceType === 'normal' && styles.variantTabTextActive]}>Classic</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.variantTab, selectedJuiceType === 'very_pure' && styles.variantTabActive]}
                onPress={(e) => { e.stopPropagation(); setSelectedJuiceType('very_pure'); }}
              >
                <Text style={[styles.variantTabText, selectedJuiceType === 'very_pure' && styles.variantTabTextActive]}>Pure</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, isDisabled && styles.textMuted]}>{ProductService.formatPrice(currentPrice)}</Text>
              {currentMrp && currentMrp > currentPrice && (
                <Text style={styles.mrp}>{ProductService.formatPrice(currentMrp)}</Text>
              )}
            </View>

            <View style={styles.actionArea}>

              {!isOutOfStock ? (
                currentCartQty > 0 && !isStoreClosed ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        onRemoveFromCart?.(isJuice ? selectedJuiceType : undefined);
                      }} 
                      style={styles.stepBtn}
                    >
                      <Minus size={14} color="#FFF" strokeWidth={3} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{currentCartQty}</Text>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        if (isJuice) {
                          onAddToCartVariant?.(selectedJuiceType);
                        } else {
                          onAddToCart?.();
                        }
                      }} 
                      style={styles.stepBtn}
                      disabled={currentCartQty >= stock}
                    >
                      <Plus size={14} color="#FFF" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      if (isJuice) {
                        onAddToCartVariant?.(selectedJuiceType);
                      } else {
                        onAddToCart?.();
                      }
                    }} 
                    style={[styles.addBtn, isStoreClosed && styles.addBtnDisabled]} 
                    activeOpacity={0.8}
                    disabled={isStoreClosed}
                  >
                    <Text style={[styles.addBtnText, isStoreClosed && styles.textMuted]}>ADD</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={styles.outOfStockLabel}>
                  <Text style={styles.outOfStockLabelText}>OUT</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 160,
    marginRight: SPACING.md,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    minHeight: 260,
    ...SHADOWS.sm,
  },
  cardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.md,
    zIndex: 10,
  },
  discountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
  },
  imageWrapper: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGrey: {
    opacity: 0.5,
    tintColor: 'gray',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.error,
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 8,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primaryGreen,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  textMuted: {
    color: '#94a3b8',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  mrp: {
    fontSize: 11,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
    marginTop: -2,
  },
  actionArea: {
    alignItems: 'flex-end',
  },
  addBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: COLORS.primaryGreen,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...SHADOWS.sm,
  },
  addBtnText: {
    color: COLORS.primaryGreen,
    fontSize: 12,
    fontWeight: '800',
  },
  addBtnDisabled: {
    borderColor: '#CBD5E1',
    opacity: 0.5,
  },
  outOfStockLabel: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  outOfStockLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.error,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.sm,
    height: 32,
    paddingHorizontal: 2,
  },
  stepBtn: {
    padding: 6,
  },
  qtyText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  outOfStock: {
    fontSize: 10,
    color: COLORS.error,
    fontWeight: '700',
  },
  variantPicker: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
    width: '100%',
  },
  variantTab: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  variantTabActive: {
    backgroundColor: '#FFF',
    ...SHADOWS.sm,
  },
  variantTabText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  variantTabTextActive: {
    color: COLORS.primaryGreen,
  },
});

export default React.memo(PremiumCard);
