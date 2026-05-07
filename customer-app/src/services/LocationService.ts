import * as Location from 'expo-location';
import axios from 'axios';
import { monitor } from './MonitoringService';
import { Platform } from 'react-native';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface StructuredAddress {
  formattedAddress: string;
  street?: string;
  houseNumber?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

/**
 * LocationService
 * Professional-grade location engine for Juicy App.
 * Handles permissions, accurate GPS fetching, and reverse geocoding.
 */
export const LocationService = {
  /**
   * Comprehensive permission handler
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (err) {
      monitor.log('ERROR', 'Location', 'Permission workflow failed', { err });
      return false;
    }
  },

  /**
   * Get current coordinates with fallback logic
   */
  async getCurrentCoords(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        monitor.log('WARN', 'Location', 'Location services disabled');
        return null;
      }

      // Try high accuracy first with a shorter timeout
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Location timeout')), 10000)
        )
      ]) as Location.LocationObject;

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (err) {
      monitor.log('ERROR', 'Location', 'GPS fetch failed', { err });
      
      // Fallback: Last known location (faster, less accurate)
      try {
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation) {
          return {
            latitude: lastLocation.coords.latitude,
            longitude: lastLocation.coords.longitude,
          };
        }
      } catch (innerErr) {
        // Ignore inner error
      }
      
      return null;
    }
  },

  /**
   * High-reliability reverse geocoding
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<StructuredAddress | null> {
    // 1. Prioritize Google Maps API for production-grade results (esp. on Web/Android)
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
        const { data } = await axios.get(url, { timeout: 5000 });

        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          const components = result.address_components;

          const address: StructuredAddress = {
            formattedAddress: result.formatted_address,
            latitude,
            longitude,
          };

          components.forEach((c: any) => {
            const types = c.types;
            if (types.includes('street_number')) address.houseNumber = c.long_name;
            if (types.includes('route')) address.street = c.long_name;
            if (types.includes('sublocality_level_1') || types.includes('neighborhood')) address.area = c.long_name;
            if (types.includes('locality')) address.city = c.long_name;
            if (types.includes('administrative_area_level_1')) address.state = c.long_name;
            if (types.includes('country')) address.country = c.long_name;
            if (types.includes('postal_code')) address.postalCode = c.long_name;
          });

          return address;
        }
      } catch (err) {
        monitor.log('WARN', 'Location', 'Google Geocode failed', { err });
      }
    }

    // 2. Fallback to OpenStreetMap (Nominatim) - Free and Keyless (Great for Web/Dev)
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const { data } = await axios.get(url, { 
        headers: { 'User-Agent': 'JuicyApp/1.0' },
        timeout: 5000 
      });

      if (data && data.address) {
        const addr = data.address;
        return {
          formattedAddress: data.display_name,
          street: addr.road || addr.suburb || '',
          houseNumber: addr.house_number || '',
          area: addr.neighbourhood || addr.suburb || addr.district || '',
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || '',
          country: addr.country || '',
          postalCode: addr.postcode || '',
          latitude,
          longitude,
        };
      }
    } catch (err) {
      monitor.log('WARN', 'Location', 'Nominatim fallback failed', { err });
    }

    // 3. Fallback to Expo Native Geocoder (Best for iOS/Android)
    if (Platform.OS !== 'web') {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) {
          const r = results[0];
          const street = r.street || r.name || '';
          const area = r.district || r.subregion || '';
          
          return {
            formattedAddress: [street, area, r.city, r.region, r.postalCode].filter(Boolean).join(', '),
            street,
            area,
            city: r.city || '',
            state: r.region || '',
            postalCode: r.postalCode || '',
            country: r.country || '',
            latitude,
            longitude,
          };
        }
      } catch (err) {
        monitor.log('ERROR', 'Location', 'Native fallback geocode failed', { err });
      }
    }

    return null;
  },

  getGoogleMapsLink(latitude: number, longitude: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
};
