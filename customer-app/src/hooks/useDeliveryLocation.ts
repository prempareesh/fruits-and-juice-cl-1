import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useSettings } from './useSettings';

export function useDeliveryLocation() {
  const { settings } = useSettings();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setChecking(false);
          return;
        }

        // Get current position with higher accuracy for distance check
        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(userLocation);

        // Standardized settings columns: latitude, longitude, service_radius_km
        const storeLat = Number(settings?.latitude || settings?.store_lat);
        const storeLng = Number(settings?.longitude || settings?.store_lng);
        const radiusLimit = Number(settings?.service_radius_km || settings?.delivery_radius);

        if (storeLat && storeLng) {
          const dist = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            storeLat,
            storeLng
          );
          
          setDistance(dist);
          setIsWithinRadius(dist <= radiusLimit);

          console.log('--- DELIVERY LOGIC DEBUG ---');
          console.log('STORE COORDS:', { lat: storeLat, lng: storeLng });
          console.log('CUSTOMER COORDS:', { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude });
          console.log('CALCULATED DISTANCE:', dist.toFixed(2), 'km');
          console.log('RADIUS LIMIT:', radiusLimit, 'km');
          console.log('IS WITHIN RADIUS:', dist <= radiusLimit);
          console.log('----------------------------');
        }
      } catch (err) {
        console.error('Error getting location:', err);
        setErrorMsg('Error fetching location');
      } finally {
        setChecking(false);
      }
    })();
  }, [settings]);

  // Haversine formula to calculate distance in km
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  return { 
    location, 
    distance, 
    isWithinRadius, 
    checking, 
    errorMsg,
    estimatedTime: settings?.delivery_time || settings?.estimated_delivery_time || '15 min'
  };
}
