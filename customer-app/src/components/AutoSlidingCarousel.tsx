import React, { useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Pressable
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';
import { getResponsiveCardWidth, BREAKPOINTS } from '../theme/responsive';
import { ArrowRight } from 'lucide-react-native';

interface Product {
  id: string;
  name: string;
  price: string | number;
  image_url?: string;
  category?: string;
}

interface AutoSlidingCarouselProps {
  products: Product[];
  title?: string;
  onPressItem?: (id: string) => void;
}

const ProductCard = ({ product, width, height, onPress }: { product: Product; width: number; height: number; onPress?: () => void }) => {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card, 
        { width, height, opacity: pressed ? 0.8 : 1, zIndex: 100 }
      ]}
      onPress={() => {
        console.log('[Carousel] Item pressed:', product.id);
        onPress?.();
      }}
    >
      <Image
        source={{ uri: product.image_url || "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?q=80&w=600&auto=format" }}
        style={styles.image}
        contentFit="cover"
        transition={500}
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={styles.topInfo}>
          <Text style={styles.priceTag}>₹{product.price}</Text>
          <View style={styles.arrowCircle}>
             <ArrowRight size={14} color={COLORS.white} />
          </View>
        </View>
        
        <View style={styles.bottomInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.categoryName}>
            {product.category?.toUpperCase() || 'PREMIUM'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export const AutoSlidingCarousel = ({ products, title = "Luxury Picks", onPressItem }: AutoSlidingCarouselProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const currentIndex = useRef(0);
  
  // Auto-slide logic
  React.useEffect(() => {
    if (products.length <= 1) return;

    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % products.length;
      flatListRef.current?.scrollToIndex({
        index: currentIndex.current,
        animated: true,
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [products]);
  
  const GAP = 12;
  const PADDING = windowWidth > BREAKPOINTS.LAPTOP ? 40 : 20;
  
  const cardWidth = useMemo(() => getResponsiveCardWidth(windowWidth, GAP, PADDING), [windowWidth]);
  
  // Luxury Proportions
  const cardHeight = useMemo(() => {
    if (windowWidth >= BREAKPOINTS.LAPTOP) return 240;
    if (windowWidth >= BREAKPOINTS.TABLET) return 210;
    return 190; // Taller portrait for mobile
  }, [windowWidth]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.header}>
        <View style={styles.titleLine} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.titleLine} />
      </View>

      <FlatList
        ref={flatListRef}
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            width={cardWidth} 
            height={cardHeight} 
            onPress={() => {
              console.log('[Carousel] Item clicked:', item.id);
              onPressItem?.(item.id);
            }}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: PADDING }]}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        pointerEvents="auto"
        getItemLayout={(_, index) => ({
          length: cardWidth + GAP,
          offset: (cardWidth + GAP) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ 
            offset: info.averageItemLength * info.index, 
            animated: true 
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 32,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.luxuryDark,
    marginHorizontal: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
    maxWidth: 60,
  },
  listContent: {
    gap: 12,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cream,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px -10px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      }
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
    justifyContent: 'space-between',
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTag: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.label.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    marginTop: 'auto',
  },
  productName: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  categoryName: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: TYPOGRAPHY.label.fontFamily,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
