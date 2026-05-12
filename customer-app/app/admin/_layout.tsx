import { Slot } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AdminLayout() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const role = profile?.role || 'user';
        const isAdmin = ['admin', 'super_admin', 'store_admin'].includes(role);

        if (!isAdmin) {
          console.warn('[AdminGuard] Unauthorized access attempt by', user.email);
          router.replace('/(tabs)');
        } else {
          setIsVerifying(false);
        }
      } catch (err) {
        console.error('[AdminGuard] Error:', err);
        router.replace('/login');
      }
    }
    verifyAdmin();
  }, []);

  if (isVerifying) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={{ marginTop: 16, color: COLORS.mutedGray, fontWeight: '600' }}>Verifying Administrator Privileges...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Slot />
    </View>
  );
}

