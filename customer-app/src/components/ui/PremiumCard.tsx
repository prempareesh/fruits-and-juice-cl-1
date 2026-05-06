import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  Dimensions, 
  Pressable, 
  Platform,
  ViewStyle,
  ImageStyle,
  TextStyle
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  FadeInUp,
  Layout
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../../theme/tokens';
import { ProductService } from '../../services/ProductService';
import { Star, ShoppingCart, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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
  isLiked?: boolean;
  onLike?: () => void;
  variant?: 'minimal' | 'glass' | 'elevated';
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  id,
  index,
  title,
  subtitle,
  price,
  imageUrl,
  category,
  rating = 4.5,
  onPress,
  onAddToCart,
  isAvailable = true,
  isLiked = false,
  onLike,
  variant = 'elevated'
}) => {
  const { width: windowWidth } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = windowWidth > 768;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const CARD_WIDTH = (windowWidth - SPACING.md * (isLargeScreen ? 4 : 3)) / (isLargeScreen ? 3 : 2);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  const renderBadges = () => (
    <View style={styles.badgeContainer}>
      <BlurView intensity={20} style={styles.ratingBadge}>
        <Star size={10} color="#FFB800" fill="#FFB800" />
        <Text style={styles.ratingText}>{rating}</Text>
      </BlurView>
      {onLike && (
        <Pressable onPress={onLike} style={styles.likeBtn}>
          <Heart size={16} color={isLiked ? '#FF4B2B' : COLORS.white} fill={isLiked ? '#FF4B2B' : 'transparent'} />
        </Pressable>
      )}
    </View>
  );

  return (
    <Animated.View 
      entering={FadeInUp.delay(Math.min((index % 10) * 100, 1000)).springify().damping(12)}
      layout={Layout.springify()}
      style={[styles.container, { width: isWeb ? 'auto' : CARD_WIDTH }, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.pressable,
          variant === 'elevated' && styles.elevatedShadow,
          !isAvailable && styles.disabled
        ]}
      >
        <View style={[styles.imageWrapper, { aspectRatio: 0.85 }]}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image} 
            resizeMode="contain" 
          />
          {renderBadges()}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.imageOverlay}
          />
          {!isAvailable && (
            <BlurView intensity={30} style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </BlurView>
          )}
        </View>

        <View style={styles.content}>
          {category && <Text style={styles.category}>{category}</Text>}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          
          <View style={styles.footer}>
            <View>
              <Text style={styles.priceSymbol}>{ProductService.formatPrice(price)}</Text>
              <Text style={styles.unit}>per unit</Text>
            </View>

            {onAddToCart && isAvailable && (
              <Pressable 
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                style={styles.addToCartBtn}
              >
                <LinearGradient
                  colors={[COLORS.primaryGreen, '#1b5e20']}
                  style={styles.cartGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <ShoppingCart size={16} color={COLORS.white} />
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  pressable: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  elevatedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  disabled: {
    opacity: 0.8,
  },
  imageWrapper: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc', // Light background for 'contain' mode
    padding: 10,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeContainer: {
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  likeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    padding: 14,
  },
  category: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mutedGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'System', // Will use Poppins if loaded in App.tsx
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.mutedGray,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  priceSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryGreen,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
  },
  unit: {
    fontSize: 10,
    color: COLORS.mutedGray,
    marginTop: -2,
    fontWeight: '600',
  },
  addToCartBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cartGradient: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(PremiumCard);
