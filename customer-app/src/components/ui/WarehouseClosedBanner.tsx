import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, Clock } from 'lucide-react-native';
import { useSettings } from '@/src/hooks/useSettings';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const WarehouseClosedBanner = () => {
  const { settings, isClosed } = useSettings();

  if (!isClosed) return null;

  return (
    <Animated.View entering={FadeInDown} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Clock size={20} color="#EF4444" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Warehouse is Currently Closed</Text>
          <Text style={styles.subtitle}>
            We are not accepting new orders at the moment. Please check back later.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  subtitle: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
});
