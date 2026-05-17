import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  Dimensions,
  Pressable,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { Zap } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/src/theme/tokens';
import { useCartStore } from '@/src/store/useCartStore';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 220;

const HotDealCard = ({ item }: { item: any }) => {
  const { addItem, items } = useCartStore();
  const router = useRouter();
  const cartItem = items.find(i => i.productId === item.id);
  
  const discount = item.mrp && item.mrp > (item.selling_price || item.price) 
    ? Math.round(((item.mrp - (item.selling_price || item.price)) / item.mrp) * 100)
    : 0;

  return (
    <Pressable 
      style={styles.hotDealCard}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      )}
      <Image source={{ uri: item.image_url }} style={styles.hotDealImage} />
      <View style={styles.hotDealInfo}>
        <Text style={styles.hotDealName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.hotDealPriceRow}>
          <View>
            <Text style={styles.hotDealPrice}>₹{item.selling_price || item.price}</Text>
            {discount > 0 && (
              <Text style={styles.hotDealMrp}>₹{item.mrp}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.addBtnSmall} 
            onPress={() => addItem(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnTextSmall}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

export const HotDealsSection = ({ products }: { products: any[] }) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % products.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4000); // 4 seconds for slow, smooth motion

    return () => clearInterval(interval);
  }, [currentIndex, products]);

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Zap size={22} color="#FF9900" fill="#FF9900" />
          <Text style={styles.sectionTitle}>HOT DEALS</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Fruits & Vegetables at lowest prices</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `hot-${item.id}`}
        renderItem={({ item }) => <HotDealCard item={item} />}
        contentContainerStyle={{ paddingLeft: SPACING.lg, paddingRight: SPACING.lg }}
        snapToInterval={ITEM_WIDTH + SPACING.md}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + SPACING.md,
          offset: (ITEM_WIDTH + SPACING.md) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    backgroundColor: '#FFF',
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  hotDealCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginRight: SPACING.md,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    zIndex: 10,
  },
  discountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  hotDealImage: {
    width: '100%',
    height: 140,
    resizeMode: 'contain',
    marginBottom: SPACING.md,
  },
  hotDealInfo: {
    gap: 8,
  },
  hotDealName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
  },
  hotDealPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  hotDealPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryGreen,
  },
  hotDealMrp: {
    fontSize: 12,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  addBtnSmall: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  addBtnTextSmall: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
