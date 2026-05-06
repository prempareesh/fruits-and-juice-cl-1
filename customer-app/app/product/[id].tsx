import * as React from 'react';
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Product, JuiceVariant } from '../../src/types';
import { ChevronLeft, ShoppingBag, Plus, Minus, ShieldCheck, Clock, Star, Info, Leaf } from 'lucide-react-native';
import { useCartStore } from '../../src/store/useCartStore';
import { ProductService } from '../../src/services/ProductService';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Toast, ToastHandle } from '../../src/components/ui/Toast';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<JuiceVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<JuiceVariant | null>(null);
  const [weight, setWeight] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const insets = useSafeAreaInsets();
  const toastRef = React.useRef<ToastHandle>(null);

  const cartScale = useSharedValue(1);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  async function fetchProductDetails() {
    try {
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (prodError) throw prodError;
      setProduct(prodData);

      if (prodData.category === 'juice') {
        const { data: varData, error: varError } = await supabase
          .from('juice_variants')
          .select('*')
          .eq('product_id', id);
        
        if (varError) throw varError;
        setVariants(varData);
        setSelectedVariant(varData.find((v: JuiceVariant) => v.variant_type === 'normal') || varData[0]);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = () => {
    if (product) {
      cartScale.value = withSpring(1.2, {}, () => {
        cartScale.value = withSpring(1);
      });
      addItem(product, isJuice ? selectedVariant! : undefined, isJuice ? 1 : weight);
      toastRef.current?.show('Added to your basket! 🧺', 'success');
      setTimeout(() => router.push('/(tabs)/cart'), 800);
    }
  };

  const animatedCartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }]
  }));

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7700" />
      </View>
    );
  }

  const isJuice = product.category === 'juice';
  const currentPrice = ProductService.getPrice(product, isJuice ? selectedVariant! : undefined) * (isJuice ? 1 : weight);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Toast ref={toastRef} />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image_url || (product.category === 'fruit' 
              ? 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800' 
              : 'https://images.unsplash.com/photo-1622597467827-4309112bba21?auto=format&fit=crop&q=80&w=800') }} 
            style={styles.mainImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.imageHeaderGradient}
          />
          <TouchableOpacity 
            style={[styles.backButton, { top: Math.max(insets.top + 10, 20) }]} 
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
          <View style={styles.headerInfo}>
            <View style={[styles.categoryBadge, { backgroundColor: isJuice ? '#e0f2fe' : '#f0fdf4' }]}>
              <Text style={[styles.categoryText, { color: isJuice ? '#0369a1' : '#15803d' }]}>
                {product.category.toUpperCase()}
              </Text>
            </View>
            <View style={styles.ratingBox}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
          
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Clock size={18} color="#FF7700" />
              </View>
              <Text style={styles.statValue}>20-30</Text>
              <Text style={styles.statLabel}>min</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Leaf size={18} color="#10b981" />
              </View>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Organic</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Info size={18} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>Fresh</Text>
              <Text style={styles.statLabel}>Picked</Text>
            </View>
          </View>

          {isJuice ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Quality</Text>
              <View style={styles.variantContainer}>
                {variants.map((v) => (
                  <TouchableOpacity 
                    key={v.id}
                    activeOpacity={0.8}
                    style={[
                      styles.variantCard, 
                      selectedVariant?.id === v.id && styles.selectedVariant
                    ]}
                    onPress={() => setSelectedVariant(v)}
                  >
                    <View style={styles.variantHeader}>
                      <Text style={[
                        styles.variantName,
                        selectedVariant?.id === v.id && styles.selectedVariantText
                      ]}>
                        {v.variant_type === 'very_pure' ? 'Super Pure' : 'Classic'}
                      </Text>
                      {v.stock_units <= 0 && (
                        <View style={styles.outOfStockBadgeSmall}>
                          <Text style={styles.outOfStockTextSmall}>Out of Stock</Text>
                        </View>
                      )}
                      {v.variant_type === 'very_pure' && v.stock_units > 0 && <ShieldCheck size={16} color={selectedVariant?.id === v.id ? '#FFFFFF' : '#FF7700'} />}
                    </View>
                    <Text style={[
                      styles.variantPrice,
                      selectedVariant?.id === v.id && styles.selectedVariantText
                    ]}>
                      {ProductService.formatPrice(v.price)}
                    </Text>
                    <Text style={[
                      styles.variantSize,
                      selectedVariant?.id === v.id && styles.selectedVariantText
                    ]}>
                      {v.ml}ml Glass Bottle
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Weight</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setWeight(Math.max(1, weight - 1))}
                >
                  <Minus size={22} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.weightDisplay}>
                  <Text style={styles.weightText}>{weight}</Text>
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setWeight(Math.min(product.stock_kg || 0, weight + 1))}
                >
                  <Plus size={22} color="#1e293b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.priceHint}>Approx {ProductService.formatPrice(product.price_per_kg || 0)} per kg</Text>
            </View>
          )}

          <View style={styles.spacer} />
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalPrice}>{ProductService.formatPrice(currentPrice)}</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.cartButtonContainer} 
          onPress={handleAddToCart}
          disabled={isJuice ? (selectedVariant?.stock_units || 0) <= 0 : (product.stock_kg || 0) <= 0}
        >
          <Animated.View style={[
            styles.cartButton, 
            animatedCartStyle,
            (isJuice ? (selectedVariant?.stock_units || 0) <= 0 : (product.stock_kg || 0) <= 0) && styles.disabledButton
          ]}>
            <LinearGradient
              colors={ (isJuice ? (selectedVariant?.stock_units || 0) <= 0 : (product.stock_kg || 0) <= 0) 
                ? ['#94a3b8', '#64748b'] 
                : ['#FF9900', '#FF6600']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <ShoppingBag size={20} color="#FFFFFF" style={styles.cartIcon} />
              <Text style={styles.cartButtonText}>
                {(isJuice ? (selectedVariant?.stock_units || 0) <= 0 : (product.stock_kg || 0) <= 0) 
                  ? 'Out of Stock' 
                  : 'Add to Cart'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: 420,
    backgroundColor: '#f8fafc',
  },
  mainImage: {
    width: width,
    height: '100%',
    resizeMode: 'cover',
  },
  imageHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    padding: 28,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#FFFFFF',
    marginTop: -40,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ratingText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#92400e',
    marginLeft: 6,
  },
  name: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: '#1e293b',
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#1e293b',
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 18,
  },
  variantContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  variantCard: {
    width: '48%',
    padding: 18,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  selectedVariant: {
    borderColor: '#FF7700',
    backgroundColor: '#fff7ed',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  variantName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#64748b',
  },
  variantPrice: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#1e293b',
    marginVertical: 4,
  },
  variantSize: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  selectedVariantText: {
    color: '#FF7700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 10,
    width: 200,
  },
  stepperButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#1e293b',
  },
  weightUnit: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  priceHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 14,
    marginLeft: 4,
  },
  spacer: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 45 : 30,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  totalLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#94a3b8',
  },
  totalPrice: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: '#1e293b',
  },
  cartButtonContainer: {
    flex: 1,
    marginLeft: 24,
  },
  cartButton: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF7700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  cartIcon: {
    marginRight: 12,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
    fontSize: 17,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  outOfStockBadgeSmall: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  outOfStockTextSmall: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
  }
});
