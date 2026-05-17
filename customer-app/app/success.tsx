import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, PackageOpen, ChevronRight, Home } from 'lucide-react-native';

export default function SuccessScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle2 size={80} color="#10b981" />
        </View>
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>Your order <Text style={{fontWeight: '700'}}>#{orderId}</Text> has been confirmed and is being packed.</Text>

        <View style={styles.deliveryCard}>
          <PackageOpen size={24} color="#3A8C3F" />
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryTitle}>Estimated Delivery</Text>
            <Text style={styles.deliveryTime}>15 - 20 minutes</Text>
          </View>
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.trackBtn}
          onPress={() => router.replace(`/orders/${orderId}` as any)}
        >
          <Text style={styles.trackBtnText}>Track Order</Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Home size={18} color="#1e293b" />
          <Text style={styles.homeBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    backgroundColor: '#ecfdf5',
    padding: 20,
    borderRadius: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  deliveryInfo: {
    marginLeft: 16,
  },
  deliveryTitle: {
    fontSize: 14,
    color: '#3A8C3F',
    fontWeight: '600',
    marginBottom: 4,
  },
  deliveryTime: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '800',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  trackBtn: {
    backgroundColor: '#3A8C3F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#3A8C3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  homeBtn: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  homeBtnText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});
