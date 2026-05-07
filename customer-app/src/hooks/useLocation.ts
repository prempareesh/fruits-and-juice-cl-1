import { useState, useCallback, useRef } from 'react';
import { LocationService, StructuredAddress } from '../services/LocationService';
import { monitor } from '../services/MonitoringService';
import { Platform, Linking } from 'react-native';

interface UseLocationResult {
  loading: boolean;
  error: string | null;
  address: StructuredAddress | null;
  fetchLocation: () => Promise<void>;
  resetError: () => void;
  openSettings: () => void;
}

export function useLocation(): UseLocationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<StructuredAddress | null>(null);
  const fetchInProgress = useRef(false);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const fetchLocation = useCallback(async () => {
    if (fetchInProgress.current) return; // Prevent duplicate clicks
    
    try {
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);

      const hasPermission = await LocationService.requestPermissions();
      if (!hasPermission) {
        setError('Location permission denied. Please enable it in settings.');
        setLoading(false);
        fetchInProgress.current = false;
        return;
      }

      const coords = await LocationService.getCurrentCoords();
      if (!coords) {
        setError('Could not fetch GPS signal. Ensure Location Services are turned on.');
        setLoading(false);
        fetchInProgress.current = false;
        return;
      }

      const structuredAddress = await LocationService.reverseGeocode(coords.latitude, coords.longitude);
      
      if (structuredAddress) {
        setAddress(structuredAddress);
      } else {
        // Fallback to purely coordinates
        setAddress({
          formattedAddress: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
          street: '', houseNumber: '', area: '', city: '', state: '', country: '', postalCode: '', landmark: '',
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        setError('Geocoding failed. Using raw coordinates.');
      }
    } catch (err: any) {
      monitor.log('ERROR', 'useLocation', 'Fatal hook error', { err: err.message });
      setError('An unexpected error occurred while fetching location.');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, []);

  return {
    loading,
    error,
    address,
    fetchLocation,
    resetError: () => setError(null),
    openSettings
  };
}
