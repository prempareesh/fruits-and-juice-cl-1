import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Image,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, X, ShoppingBag } from 'lucide-react-native';
import { useProducts } from '@/src/hooks/useProducts';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/src/theme/tokens';
import PremiumCard from '@/src/components/ui/PremiumCard';
import Animated, { FadeIn, FadeInUp, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const { products, loading } = useProducts();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Focus search input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.category?.toLowerCase().includes(lowerQuery)
    );
  }, [products, query]);

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 50).springify()} 
      layout={Layout.springify()}
      style={styles.cardContainer}
    >
      <PremiumCard 
        id={item.id}
        index={index}
        title={item.name}
        price={item.selling_price || item.price}
        mrp={item.mrp}
        imageUrl={item.image_url}
        category={item.category}
        onPress={() => router.push(`/product/${item.id}`)}
      />
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Sticky Search Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={COLORS.dark} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.primaryGreen} strokeWidth={2.5} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder='Search for "mangoes", "milk", "juice"...'
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color={COLORS.muted} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Section */}
      {query.length > 0 ? (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeIn} style={styles.emptyState}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }} 
                style={styles.emptyImage} 
              />
              <Text style={styles.emptyTitle}>No results found for "{query}"</Text>
              <Text style={styles.emptySubtitle}>Try searching for something else like "Fruits" or "Vegetables"</Text>
            </Animated.View>
          }
        />
      ) : (
        <View style={styles.placeholderState}>
          <View style={styles.popularSearchContainer}>
            <Text style={styles.popularTitle}>Popular Searches</Text>
            <View style={styles.tagContainer}>
              {['Mango', 'Fresh Juice', 'Green Chillies', 'Banana', 'Tomato'].map((tag) => (
                <TouchableOpacity 
                  key={tag} 
                  style={styles.tag}
                  onPress={() => setQuery(tag)}
                >
                  <Search size={14} color={COLORS.primaryGreen} style={{ marginRight: 6 }} />
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    height: '100%',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardContainer: {
    width: (width - SPACING.md * 3) / 2,
  },
  placeholderState: {
    flex: 1,
    padding: SPACING.xl,
  },
  popularSearchContainer: {
    marginTop: 10,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: SPACING.lg,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.6,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
