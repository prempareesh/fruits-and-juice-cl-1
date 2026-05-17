import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  FlatList, 
  Image, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Text,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/src/theme/tokens';
import Animated, { FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

const BANNERS = [
  {
    id: '1',
    image: require('../../../assets/banners/banner1.png'),
  },
  {
    id: '2',
    image: require('../../../assets/banners/banner2.png'),
  },
  {
    id: '3',
    image: require('../../../assets/banners/banner3.png'),
  },
  {
    id: '4',
    image: require('../../../assets/banners/banner4.png'),
  }
];

export const BannerCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % BANNERS.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.bannerContainer}>
      <TouchableOpacity activeOpacity={0.95} style={styles.banner}>
        <Image 
          source={item.image} 
          style={styles.image} 
          resizeMode="cover"
        />
        {/* Removed LinearGradient and Text overlays to preserve the baked-in text in the premium banners */}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={width}
        decelerationRate="fast"
      />
      <View style={styles.pagination}>
        {BANNERS.map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              { 
                backgroundColor: i === activeIndex ? COLORS.primaryGreen : '#E2E8F0', 
                width: i === activeIndex ? 24 : 8 
              }
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    backgroundColor: '#FFF',
  },
  bannerContainer: {
    width: width,
    paddingHorizontal: SPACING.lg,
  },
  banner: {
    width: BANNER_WIDTH,
    height: 220, // Increased height to match image aspect ratio and prevent text clipping
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.xl,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.md,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  ctaBtn: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  }
});
