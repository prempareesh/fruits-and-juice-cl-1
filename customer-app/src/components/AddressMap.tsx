import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RefreshCcw } from 'lucide-react-native';
import { COLORS } from '../theme/tokens';

interface AddressMapProps {
  location: { latitude: number; longitude: number };
  addressName?: string;
  onRefresh: () => void;
}

export default function AddressMap({ location, addressName, onRefresh }: AddressMapProps) {
  return (
    <View style={[styles.mapContainer, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
      <View style={styles.markerContainer}>
        <View style={styles.markerCircle} />
      </View>
      <Text style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>Location Selected</Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
        <RefreshCcw size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    padding: 10,
  },
  markerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryGreen,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  refreshBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
});
