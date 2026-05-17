import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Pressable,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SHOWCASE_CONFIG, SHOWCASE_ITEMS } from '../constants/showcaseConfig';
import { ProductImage } from './ui/ProductImage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme/tokens';
import { ArrowRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ShowcaseCard = ({ item }: { item: typeof SHOWCASE_ITEMS[0] }) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <ProductImage 
          name={item.title}
          category={item.category}
          imageUrl={item.imageUrl}
          style={styles.image}
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
        />

        <BlurView intensity={20} style={styles.glassContent}>
          <View>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <View style={styles.exploreBtn}>
            <ArrowRight size={16} color="#fff" />
          </View>
        </BlurView>
      </View>
    </View>
  );
};

export const HomeShowcaseSlider = () => {
  const translateX = useSharedValue(0);
  
  // Multiply items for seamless loop
  const duplicatedItems = useMemo(() => [
    ...SHOWCASE_ITEMS, 
    ...SHOWCASE_ITEMS,
    ...SHOWCASE_ITEMS
  ], []);

  const totalWidth = (SHOWCASE_CONFIG.CARD_WIDTH + SHOWCASE_CONFIG.GAP) * SHOWCASE_ITEMS.length;

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-totalWidth, {
        duration: totalWidth / (SHOWCASE_CONFIG.AUTOPLAY_SPEED / 100),
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePressIn = () => {
    cancelAnimation(translateX);
  };

  const handlePressOut = () => {
    translateX.value = withRepeat(
      withTiming(-totalWidth, {
        duration: (totalWidth + translateX.value) / (SHOWCASE_CONFIG.AUTOPLAY_SPEED / 100),
        easing: Easing.linear,
      }),
      -1,
      false
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionSubtitle}>EXPLORE COLLECTIONS</Text>
          <Text style={styles.sectionTitle}>Curated For You</Text>
        </View>
        <Pressable style={styles.viewAll}>
          <Text style={styles.viewAllText}>View Gallery</Text>
        </Pressable>
      </View>

      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.sliderContainer}
      >
        <Animated.View style={[styles.track, animatedStyle]}>
          {duplicatedItems.map((item, index) => (
            <ShowcaseCard key={`${item.id}-${index}`} item={item} />
          ))}
        </Animated.View>
        
        {/* Edge Masking for Cinematic Feel */}
        <LinearGradient
          colors={['#fff', 'transparent', 'transparent', '#fff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primaryGreen,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.darkText,
  },
  viewAll: {
    paddingBottom: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mutedGray,
  },
  sliderContainer: {
    height: SHOWCASE_CONFIG.CARD_HEIGHT + 40,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    paddingLeft: 24,
    paddingTop: 10,
  },
  cardContainer: {
    width: SHOWCASE_CONFIG.CARD_WIDTH,
    height: SHOWCASE_CONFIG.CARD_HEIGHT,
    marginRight: SHOWCASE_CONFIG.GAP,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glassContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  exploreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
