import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { ShoppingBag, User, ChevronDown } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS, RADIUS } from '@/src/theme/tokens';
import { useCartStore } from '@/src/store/useCartStore';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LocationModal } from './LocationModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PremiumHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLocationModalVisible, setLocationModalVisible] = React.useState(false);
  
  const { 
    items, 
    selectedAddress, 
    isServiceable, 
    isCheckingRadius 
  } = useCartStore();
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Derive display values from store
  const displayAddress = selectedAddress?.formattedAddress || 'Set Delivery Location';
  const displayArea = selectedAddress?.area || selectedAddress?.city || 'Tap to select';
  const estimatedTime = '15-25 MIN'; // This can be moved to settings/store later

  return (
    <View style={[styles.outerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <Animated.View entering={FadeIn} style={[
            styles.deliveryBadge,
            !isServiceable && styles.unavailableBadge
          ]}>
            <Text style={styles.deliveryTime}>
              {isCheckingRadius 
                ? 'CHECKING...' 
                : !isServiceable 
                  ? 'UNAVAILABLE' 
                  : `DELIVERY IN ${estimatedTime}`
              }
            </Text>
          </Animated.View>
          
          <TouchableOpacity 
            style={styles.locationSelector} 
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.locationRow}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {!isServiceable ? 'Out of Service' : displayArea}
              </Text>
              <ChevronDown size={14} color={COLORS.text} strokeWidth={3} />
            </View>
            <Text style={styles.addressLine} numberOfLines={1}>
              {displayAddress}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <User size={22} color={COLORS.text} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cartBtn} 
            onPress={() => router.push('/cart')}
            activeOpacity={0.9}
          >
            <ShoppingBag size={22} color="#FFF" strokeWidth={2.5} />
            {totalItems > 0 && (
              <Animated.View entering={FadeIn} style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <LocationModal 
        visible={isLocationModalVisible} 
        onClose={() => setLocationModalVisible(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#FFF',
    zIndex: 100,
    ...SHADOWS.sm,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    paddingBottom: 12,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  deliveryBadge: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
  },
  unavailableBadge: {
    backgroundColor: '#ef4444', // Red for unavailable
  },
  deliveryTime: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  locationSelector: {
    gap: 0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  addressLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: -2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.md,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5630',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
