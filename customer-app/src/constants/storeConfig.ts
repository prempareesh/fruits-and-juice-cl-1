/**
 * Global Store Configuration
 * Defines the physical location of the primary shop/warehouse.
 * Used for distance calculations and delivery fee mapping.
 */
export const STORE_CONFIG = {
  name: 'Juicy App Main Hub',
  // Removed hardcoded Mumbai coordinates to prevent incorrect distance calculations.
  // The app now fetches real-time coordinates from Supabase settings.
  latitude: null, 
  longitude: null,
  
  // Logistics Defaults (will be overridden by DB settings)
  DEFAULT_MAX_RADIUS_KM: 10,
  BASE_ESTIMATED_DELIVERY_MINS: 30,
};
