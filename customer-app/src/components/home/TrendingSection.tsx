import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  Platform,
  TouchableOpacity 
} from 'react-native';
import { supabase } from '@/lib/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/src/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 110;

const TrendingItem = ({ item }: { item: any }) => (
  <View style={styles.itemContainer}>
    <View style={styles.imageWrapper}>
      <Image source={{ uri: item.image_url || item.image }} style={styles.image} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Real</Text>
      </View>
    </View>
    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
  </View>
);

export const TrendingSection = () => {
  const [products, setProducts] = useState<any[]>([]);
  const translateX = useSharedValue(0);

  useEffect(() => {
    async function fetchTrendingProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(12);
        
        if (data && data.length > 0) {
          // Shuffle randomly as requested
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          setProducts(shuffled);
        }
      } catch (err) {
        console.error('[TrendingSection] Fetch error:', err);
      }
    }
    fetchTrendingProducts();
  }, []);

  const dataToRender = useMemo(() => [...products, ...products], [products]);
  const totalWidth = products.length * ITEM_WIDTH;

  useEffect(() => {
    if (products.length === 0) return;

    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-totalWidth, {
        duration: products.length * 3000, // Balanced speed
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => cancelAnimation(translateX);
  }, [products, totalWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>🔥 Trending Now</Text>
        </View>
        <Text style={styles.subtitle}>Real-time fresh picks from our store</Text>
      </View>

      <View style={styles.scrollWrapper} pointerEvents="none">
        <Animated.View style={[styles.ticker, animatedStyle, { width: totalWidth * 2 }]}>
          {dataToRender.map((item, index) => (
            <View key={`${item.id}-${index}`}>
              <TrendingItem item={item} />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.dark,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollWrapper: {
    overflow: 'hidden',
    width: SCREEN_WIDTH,
  },
  ticker: {
    flexDirection: 'row',
  },
  itemContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  imageWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    position: 'relative',
    marginBottom: 8,
    overflow: 'visible',
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 38,
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
});
