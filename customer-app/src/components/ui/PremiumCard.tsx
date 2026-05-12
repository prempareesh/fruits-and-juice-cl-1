import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Platform,
  Image as RNImage,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  FadeIn,
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { Star, ShoppingBag, Heart } from 'lucide-react-native';
import { getProductImageSource } from '../../utils/imageUtils';

interface PremiumCardProps {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  price: number;
  imageUrl: string;
  category?: string;
  rating?: number;
  onPress: () => void;
  onAddToCart?: () => void;
  isAvailable?: boolean;
  variant?: string;
}

/**
 * Web-safe image renderer.
 * Uses standard <img> on web to avoid expo-image / RN-Web incompatibilities.
 * Uses React Native Image on native.
 */
const SafeProductImage = React.memo(({ 
  name, category, imageUrl, style 
}: { name: string; category: string; imageUrl: string; style?: any }) => {
  const [errored, setErrored] = useState(false);
  const source = getProductImageSource(name, category, errored ? undefined : imageUrl);

  if (Platform.OS === 'web') {
    // Use native <img> on web — avoids ALL expo-image / blurhash / require() issues
    const uri = (source && source.uri) ? source.uri : 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80';
    return (
      <img
        src={uri}
        alt={name}
        onError={() => setErrored(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }

  // Native: use RN Image with fallback
  return (
    <RNImage
      source={source}
      style={[StyleSheet.absoluteFill, { resizeMode: 'contain' }]}
      onError={() => setErrored(true)}
    />
  );
});

const PremiumCard: React.FC<PremiumCardProps> = ({
  index,
  title,
  price,
  imageUrl,
  category,
  rating = 4.8,
  onPress,
  onAddToCart,
  isAvailable = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const handleAddToCart = useCallback((e: any) => {
    e.stopPropagation();
    onAddToCart?.();
  }, [onAddToCart]);

  const delay = Math.min((index % 6) * 60, 300);

  return (
    // OUTER: handles clean entrance — NO springify for better performance
    <Animated.View entering={FadeIn.duration(400).delay(delay)}>
      {/* INNER: handles subtle scale press transform */}
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={`${title}, ₹${Math.round(price)}`}
        >
          {/* Image Section */}
          <View style={styles.imageSection}>
            <SafeProductImage
              name={title}
              category={category || 'juice'}
              imageUrl={imageUrl}
              style={styles.image}
            />

            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.ratingBadge}>
                <Star size={10} color={COLORS.primaryOrange} fill={COLORS.primaryOrange} />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
              <Pressable style={styles.heartBtn} accessibilityLabel="Add to wishlist">
                <Heart size={14} color={COLORS.mutedGray} />
              </Pressable>
            </View>

            {/* Sold out overlay */}
            {!isAvailable && (
              <View style={styles.soldOutOverlay}>
                <Text style={styles.soldOutText}>RESERVED</Text>
              </View>
            )}
          </View>

          {/* Text Content */}
          <View style={styles.content}>
            <Text style={styles.category}>{(category || 'COLLECTION').toUpperCase()}</Text>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>

            <View style={styles.footer}>
              <Text style={styles.price}>₹{Math.round(price)}</Text>
              {onAddToCart && isAvailable && (
                <Pressable
                  onPress={handleAddToCart}
                  style={styles.cartBtn}
                  accessibilityLabel={`Add ${title} to cart`}
                >
                  <ShoppingBag size={16} color={COLORS.white} />
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
  },
  card: {
    backgroundColor: COLORS.cream,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 260,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px -8px rgba(0,0,0,0.08)',
      } as any,
      default: {
        elevation: 4,
        shadowColor: COLORS.luxuryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
    }),
  },
  imageSection: {
    aspectRatio: 1,
    backgroundColor: COLORS.softBeige,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  ratingText: {
    fontFamily: 'Calibri',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.luxuryDark,
  },
  heartBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  soldOutText: {
    ...TYPOGRAPHY.label,
    color: COLORS.mutedGray,
    fontSize: 10,
    letterSpacing: 2,
  },
  content: {
    padding: 16,
    paddingTop: 10,
  },
  category: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...TYPOGRAPHY.price,
    fontSize: 18,
  },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: COLORS.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(PremiumCard);
