import * as React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../../theme/tokens';
import { Product } from '../../types';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = 300;
const CARD_HEIGHT = 420;

const Card = ({ item, index, scrollY, onPress }: { item: Product, index: number, scrollY: Animated.SharedValue<number>, onPress: () => void }) => {
  const cardY = index * (CARD_HEIGHT - 60);
  
  const animatedStyle = useAnimatedStyle(() => {
    const distance = cardY - scrollY.value;
    
    const scale = interpolate(
      distance,
      [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.5, 0],
      [0.85, 1, 1],
      Extrapolation.CLAMP
    );

    const rotate = interpolate(
      distance,
      [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.5, 0],
      [0, -8, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      distance,
      [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.5, 0],
      [200, 40, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale },
        { rotate: `${rotate}deg` }
      ],
      opacity: interpolate(
        distance,
        [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.8, WINDOW_HEIGHT * 0.2],
        [0, 1, 1],
        Extrapolation.CLAMP
      )
    };
  });

  // Dynamic hue based on index for a colorful feel
  const h1 = (index * 40) % 360;
  const h2 = (h1 + 40) % 360;
  const hue = (h: number) => `hsl(${h}, 70%, 60%)`;

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <LinearGradient
        colors={[hue(h1), hue(h2)]}
        style={styles.splash}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={onPress}
        style={styles.card}
      >
        <Image 
          source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=400' }} 
          style={styles.image}
        />
        <View style={styles.textContent}>
           <Text style={styles.productName}>{item.name}</Text>
           <View style={styles.buyBadge}>
              <Text style={styles.buyText}>₹{item.price || item.price_per_kg || 80} • Explore</Text>
           </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ScrollTriggered = ({ products, onSelectProduct }: { products: Product[], onSelectProduct: (id: string) => void }) => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSpacer}>
        <Text style={styles.title}>Seasonal Harvest</Text>
        <Text style={styles.subtitle}>Hand-picked freshness just for you</Text>
      </View>
      
      {products.length > 0 ? (
        products.map((item, i) => (
          <Card 
            key={item.id} 
            item={item} 
            index={i} 
            scrollY={scrollY}
            onPress={() => onSelectProduct(item.id)}
          />
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>New harvest coming soon...</Text>
        </View>
      )}
      <View style={{ height: 240 }} />
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  headerSpacer: {
    paddingTop: 30,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Calibri',
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.darkText,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Calibri',
    fontSize: 15,
    color: COLORS.mutedGray,
    marginTop: 6,
  },
  cardContainer: {
    width: WINDOW_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: -60,
  },
  splash: {
    position: 'absolute',
    width: 260,
    height: 380,
    borderRadius: 130,
    opacity: 0.4,
    bottom: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  textContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  productName: {
    fontFamily: 'Calibri',
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buyBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  buyText: {
    fontFamily: 'Calibri',
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.mutedGray,
    fontWeight: '600',
  }
});
