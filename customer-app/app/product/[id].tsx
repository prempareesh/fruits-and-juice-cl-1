import React, { useEffect, useState, useMemo } from 'react';
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
import { Product } from '../../src/types';
import { SafeProductImage } from '../../src/components/ui/PremiumCard';
import { ChevronLeft, ShoppingBag, ShieldCheck, Clock, Leaf, Plus, Minus } from 'lucide-react-native';
import { useCartStore } from '@/src/store/useCartStore';
import { ProductService } from '../../src/services/ProductService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/theme/tokens';
import { Check, Info } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type VariantType = 'normal' | 'very_pure';

interface DisplayVariant {
  id: string;
  type: VariantType;
  label: string;
  description: string;
}

const VARIANTS: DisplayVariant[] = [
  { 
    id: 'classic', 
    type: 'normal', 
    label: 'Classic Juice', 
    description: 'Freshly squeezed fruit juice with minimal processing.' 
  },
  { 
    id: 'pure', 
    type: 'very_pure', 
    label: 'Pure Juice', 
    description: '100% Cold-pressed, no added sugar or water. 2x Concentration.' 
  }
];

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);
  const insets = useSafeAreaInsets();
  
  const [selectedVariant, setSelectedVariant] = useState<DisplayVariant>(VARIANTS[0]);

  const isJuice = useMemo(() => 
    product?.category?.toLowerCase()?.includes('juice') ?? false
  , [product?.category]);

  const currentVariant = useMemo(() => 
    isJuice ? { id: selectedVariant.id, variant_type: selectedVariant.type } : undefined
  , [isJuice, selectedVariant]);

  const { price, mrp, discountPercent } = useMemo(() => {
    const p = ProductService.getPrice(product, currentVariant);
    const basePrice = (product?.selling_price || product?.price || 70);
    const m = product?.original_price || product?.mrp || (basePrice * (selectedVariant.type === 'very_pure' ? 2 : 1) + 20);
    const d = m > p ? Math.round(((m - p) / m) * 100) : 0;
    return { price: p, mrp: m, discountPercent: d };
  }, [product, currentVariant, selectedVariant.type]);
  
  const cartItem = useMemo(() => 
    items.find(i => 
      isJuice 
        ? i.productId === id && i.variantName === selectedVariant.type
        : i.productId === id
    )
  , [items, isJuice, id, selectedVariant.type]);

  useEffect(() => {
    if (id) fetchProductDetails();
  }, [id]);

  async function fetchProductDetails() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setProduct(data);
    } catch (err) {
      console.error('[ProductDetail] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primaryGreen} /></View>;
  if (!product) return <View style={styles.center}><Text>Product not found</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mobile Header Image */}
        <View style={styles.imageWrapper}>
          <SafeProductImage
            name={product.name}
            category={product.category || ''}
            imageUrl={ProductService.getOptimizedImage(product.image_url, 420)}
            style={styles.mainImage}
          />
          <TouchableOpacity 
            style={[styles.backBtn, { top: Math.max(insets.top, 20) }]} 
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#0F172A" />
          </TouchableOpacity>

          {discountPercent > 0 && (
            <View style={[styles.detailDiscountBadge, { top: Math.max(insets.top, 20) }]}>
              <Text style={styles.detailDiscountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Details Area */}
        <View style={styles.infoArea}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.categoryName}>{product.category}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{Math.round(price)}</Text>
            {mrp > price && (
              <View style={styles.mrpContainer}>
                <Text style={styles.mrpText}>₹{Math.round(mrp)}</Text>
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>SAVE {discountPercent}%</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>About Product</Text>
          <Text style={styles.descriptionText}>
            {product.description || 'Premium quality product sourced daily to ensure maximum freshness and taste.'}
          </Text>

          {/* Variant Selection (Juice Only) */}
          {isJuice && (
            <View style={styles.variantSection}>
              <View style={styles.variantHeader}>
                <Text style={styles.sectionLabel}>Choose Variant</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              <Text style={styles.variantSublabel}>Select your preferred concentration</Text>

              <View style={styles.variantList}>
                {VARIANTS.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  const vPrice = ProductService.getPrice(product, { variant_type: v.type });
                  
                  return (
                    <TouchableOpacity 
                      key={v.id}
                      style={[
                        styles.variantCard,
                        isSelected && styles.variantCardSelected
                      ]}
                      onPress={() => setSelectedVariant(v)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.variantInfo}>
                        <View style={styles.variantTitleRow}>
                          <Text style={[styles.variantLabel, isSelected && styles.variantLabelSelected]}>{v.label}</Text>
                          {isSelected && <Check size={16} color={COLORS.primaryGreen} strokeWidth={3} />}
                        </View>
                        <Text style={styles.variantDesc} numberOfLines={2}>{v.description}</Text>
                        <Text style={[styles.variantPrice, isSelected && styles.variantPriceSelected]}>
                          {ProductService.formatPrice(vPrice)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Clock size={16} color={COLORS.primaryGreen} />
              <Text style={styles.featureText}>15 Mins</Text>
            </View>
            <View style={styles.featureItem}>
              <Leaf size={16} color={COLORS.primaryGreen} />
              <Text style={styles.featureText}>Organic</Text>
            </View>
            <View style={styles.featureItem}>
              <ShieldCheck size={16} color={COLORS.primaryGreen} />
              <Text style={styles.featureText}>Verified</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.priceInfo}>
          <Text style={styles.totalLabel}>Price</Text>
          <Text style={styles.totalValue}>₹{Math.round(price)}</Text>
        </View>
        {cartItem && cartItem.quantity > 0 ? (
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={styles.stepBtn} 
              onPress={() => removeItem(cartItem.id)}
            >
              <Minus size={20} color="#FFF" strokeWidth={3} />
            </TouchableOpacity>
            
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyCount}>{cartItem.quantity}</Text>
              <Text style={styles.qtyUnit}>in basket</Text>
            </View>

            <TouchableOpacity 
              style={[styles.stepBtn, cartItem.quantity >= (product.stock || 0) && styles.stepBtnDisabled]} 
              onPress={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
              disabled={cartItem.quantity >= (product.stock || 0)}
            >
              <Plus size={20} color="#FFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addBtn, (product.stock || 0) <= 0 && styles.addBtnDisabled]}
            onPress={() => addItem(product, isJuice ? { id: selectedVariant.id, variant_type: selectedVariant.type } as any : undefined)}
            disabled={(product.stock || 0) <= 0}
          >
            <ShoppingBag size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>
              {(product.stock || 0) <= 0 ? 'Out of Stock' : 'Add to Basket'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  imageWrapper: {
    width: 368,
    height: 368,
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 24,
    marginTop: 10,
    overflow: 'hidden',
  },
  mainImage: { 
    width: 368, 
    height: 368 
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  infoArea: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  categoryName: { fontSize: 14, color: COLORS.primaryGreen, fontWeight: '700', marginTop: 4 },
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  priceText: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  mrpText: { fontSize: 16, color: '#94A3B8', textDecorationLine: 'line-through' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#64748B', lineHeight: 22 },
  features: { flexDirection: 'row', marginTop: 24, gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  featureText: { fontSize: 12, fontWeight: '700', color: COLORS.primaryGreen },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceInfo: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  addBtn: {
    flex: 2,
    backgroundColor: COLORS.primaryGreen,
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primaryGreen,
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  variantSection: { marginTop: 24 },
  variantHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  requiredBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  requiredText: { fontSize: 9, fontWeight: '800', color: '#EF4444', textTransform: 'uppercase' },
  variantSublabel: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  variantList: { gap: 12 },
  variantCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  variantCardSelected: {
    borderColor: COLORS.primaryGreen,
    backgroundColor: '#F0FDF4',
  },
  variantInfo: { flex: 1 },
  variantTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  variantLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  variantLabelSelected: { color: COLORS.primaryGreen },
  variantDesc: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 },
  variantPrice: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  variantPriceSelected: { color: COLORS.primaryGreen },
  detailDiscountBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  detailDiscountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  mrpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  discountTagText: {
    color: COLORS.primaryGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  addBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  stepperContainer: {
    flex: 2,
    flexDirection: 'row',
    height: 54,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    elevation: 4,
    shadowColor: COLORS.primaryGreen,
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  stepBtn: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  stepBtnDisabled: {
    opacity: 0.5,
  },
  qtyDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  qtyUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: -2,
  },
});
