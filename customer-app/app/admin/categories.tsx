import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Platform,
  FlatList
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Tag, ChevronRight, Package, TrendingUp, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const FIXED_CATEGORIES = [
  { name: 'Fruits', slug: 'fruits', image: require('../../assets/categories/cat_fruits.png') },
  { name: 'Vegetables', slug: 'vegetables', image: require('../../assets/categories/cat_veggies.png') },
  { name: 'Juices', slug: 'juices', image: require('../../assets/categories/cat_juices.png') },
  { name: 'Others', slug: 'others', image: require('../../assets/categories/cat_others.png') }
];

export default function AdminCategories() {
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCategoryStats();

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('category_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchCategoryStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategoryStats = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('category, is_featured');

      if (error) throw error;

      const stats = FIXED_CATEGORIES.map(cat => {
        const catProducts = products?.filter(p => p.category === cat.name) || [];
        return {
          ...cat,
          count: catProducts.length,
          featuredCount: catProducts.filter(p => p.is_featured).length
        };
      });

      setCategoryData(stats);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryCard = (cat: any, index: number) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100)}
      style={styles.card}
    >
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Navigate to filtered products or detail
          router.push({
            pathname: '/admin/products',
            params: { initialFilter: cat.name }
          });
        }}
      >
        <Image source={cat.image} style={styles.cardImage} />
        <View style={styles.cardOverlay} />
        
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{cat.name}</Text>
          <View style={styles.cardStats}>
            <View style={styles.statRow}>
              <Package size={14} color="#fff" />
              <Text style={styles.statText}>{cat.count} Products</Text>
            </View>
            {cat.featuredCount > 0 && (
              <View style={styles.statRow}>
                <Star size={14} color="#fcd34d" />
                <Text style={styles.statText}>{cat.featuredCount} Featured</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <ChevronRight size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>Manage product collections</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {categoryData.map((cat, idx) => renderCategoryCard(cat, idx))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  scroll: { padding: 20, paddingTop: 0 },
  card: { height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  cardContent: { flex: 1 },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  cardInfo: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  cardName: { fontSize: 24, fontWeight: '800', color: '#fff' },
  cardStats: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  arrowContainer: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
});
