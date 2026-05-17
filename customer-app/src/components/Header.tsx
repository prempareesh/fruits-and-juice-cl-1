import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, TextInput } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme/tokens';
import { ShoppingCart, MapPin, ChevronDown, Search, User, X, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/useCartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onFilterPress?: () => void;
}

import { scale, moderateScale, wp } from '../utils/responsive';

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery = '', 
  setSearchQuery,
}) => {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.contentWrapper}>
        {/* Row 1: Logo/Location & Actions */}
        <View style={styles.topRow}>
          <View style={styles.locationGroup}>
            <TouchableOpacity 
              onPress={() => router.replace('/(tabs)')}
              style={styles.logoBox}
            >
              <Text style={styles.logoText}>FF</Text>
            </TouchableOpacity>
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryStatus}>
                <Text style={styles.deliveryLabel}>Delivery in 15 mins</Text>
                <ChevronDown size={12} color={COLORS.primaryGreen} />
              </View>
              <Text style={styles.addressText} numberOfLines={1}>Home - Nellore, Andhra Pradesh...</Text>
            </View>
          </View>

          <View style={styles.actionGroup}>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => router.push('/profile' as any)}
            >
              <User size={20} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cartBtn}
              onPress={() => router.push('/(tabs)/cart' as any)}
            >
              <ShoppingBag size={20} color="#1E293B" />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Full Width Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for 'milk', 'bread'..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    zIndex: 100,
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    width: '100%',
    zIndex: 10,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    height: '100%',
  },
  logoBox: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
    ...SHADOWS.sm,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_700Bold',
  },
  deliveryInfo: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: '70%',
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_700Bold',
  },
  addressText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_400Regular',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  profileBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
  },
  cartBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_700Bold',
  },
  searchRow: {
    marginTop: 12,
    width: '100%',
    zIndex: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 12,
    padding: 0,
    height: '100%',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_400Regular',
  },
});
