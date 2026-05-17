import { Tabs, useRouter } from 'expo-router';
import { Home, ShoppingCart, User, ShoppingBag, Settings } from 'lucide-react-native';
import { Platform, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../src/theme/tokens';
import { useAuth } from '../../src/providers/AuthProvider';
import Animated, { FadeInRight } from 'react-native-reanimated';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.primaryGreen,
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            // Hardened safe area handling for Android/iOS
            height: Platform.OS === 'ios' ? 70 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 10),
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : Math.max(insets.bottom, 20),
            paddingTop: 12,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0, // Clean floating look
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            position: 'absolute', // Make it feel more premium
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarLabelStyle: {
            fontWeight: '800', // Thicker labels for premium feel
            fontSize: 11,
            marginTop: 4,
            marginBottom: Platform.OS === 'android' ? 8 : 0, // Extra space for Android
          },
          headerShown: false,
          tabBarHideOnKeyboard: true, // UX Best practice
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }: { color: string }) => <Home size={22} color={color} strokeWidth={2.5} />,
          }}
        />

        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color }: { color: string }) => <ShoppingCart size={22} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color }: { color: string }) => <ShoppingBag size={22} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }: { color: string }) => <User size={22} color={color} strokeWidth={2.5} />,
          }}
        />
      </Tabs>

      {isAdmin && (
        <Animated.View 
          entering={FadeInRight.delay(500)}
          style={[styles.adminFab, { bottom: (Platform.OS === 'ios' ? 85 + insets.bottom : 85) }]}
        >
          <TouchableOpacity 
            style={styles.fabContent}
            onPress={() => router.replace('/admin')}
            activeOpacity={0.8}
          >
            <Settings size={18} color="#fff" strokeWidth={2.5} />
            <Text style={styles.fabText}>Admin</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  adminFab: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    gap: 8,
    ...SHADOWS.md,
  },
  fabText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  }
});
