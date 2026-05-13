import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { monitor } from '../services/MonitoringService';
import { Product, JuiceVariant } from '../types';
import { ProductService } from '../services/ProductService';
import { supabase } from '../../lib/supabase';
import { Alert, Platform } from 'react-native';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category: 'juice' | 'fruit';
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, variant?: JuiceVariant, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  deliveryFee: number;
  updateDeliveryFee: (lat: number, lng: number) => Promise<number>;
  getTotal: () => number;
  getGrandTotal: () => number;
  placeOrder: (userId: string, address: string, paymentType: 'online' | 'cod', initialStatus?: string, locationData?: Partial<StructuredAddress>) => Promise<string | null>;
}

import { StructuredAddress, LocationService } from '../services/LocationService';
import { STORE_CONFIG } from '../constants/storeConfig';

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryFee: 0,
      addItem: (product, variant, quantity = 1) => {
        monitor.log('INFO', 'Cart', `Adding item: ${product.name}`, { productId: product.id });
        const isJuice = product.category === 'juice';
        const variantId = variant?.id;
        const price = ProductService.getPrice(product, variant);
        const cartItemId = isJuice ? `${product.id}-${variantId}` : product.id;

        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartItemId);
          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            return {
              items: state.items.map((item) => 
                item.id === cartItemId 
                  ? { ...item, quantity: newQuantity, subtotal: newQuantity * price }
                  : item
              )
            };
          }
          const newItem: CartItem = {
            id: cartItemId,
            productId: product.id,
            name: product.name,
            category: product.category,
            variantId,
            variantName: variant?.variant_type,
            quantity,
            price,
            subtotal: price * quantity,
            image: product.image_url,
          };
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          return { items: [...state.items, newItem] };
        });
      },
      removeItem: (id) => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }))
      },
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id 
            ? { ...item, quantity, subtotal: quantity * item.price }
            : item
        )
      })),
      clearCart: () => set({ items: [], deliveryFee: 0 }),
      getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
      getGrandTotal: () => get().getTotal() + get().deliveryFee,
      updateDeliveryFee: async (lat, lng) => {
        try {
          // 1. Fetch Store Settings for Shop Location & Max Radius
          const { data: settings, error: sError } = await supabase
            .from('store_settings')
            .select('*')
            .limit(1)
            .single();

          if (sError || !settings) throw new Error("Store configuration missing");

          // 2. Calculate Distance
          const shopLat = settings.shop_latitude || STORE_CONFIG.latitude;
          const shopLng = settings.shop_longitude || STORE_CONFIG.longitude;
          
          const distance = LocationService.calculateDistance(shopLat, shopLng, lat, lng);
          const maxRadius = settings.max_delivery_radius || STORE_CONFIG.DEFAULT_MAX_RADIUS_KM;

          // 3. Radius Blocking & Fee Logic
          if (distance > maxRadius) {
            throw new Error(`Sorry, delivery is unavailable for your location. (Distance: ${distance}km, Max Serviceable: ${maxRadius}km)`);
          }

          // 4. Dynamic Zone Calculation
          let fee = 0;
          const freeRadius = settings.free_delivery_radius || 3;
          
          if (distance <= freeRadius) {
            fee = 0; // Zone 1: Free
          } else if (distance <= maxRadius) {
            fee = settings.delivery_fee || 30; // Zone 2: Paid
          }

          set({ deliveryFee: fee });
          return fee;
        } catch (err: any) {
          console.warn('[CartStore] Delivery validation failed:', err.message);
          set({ deliveryFee: 0 });
          throw err;
        }
      },
      placeOrder: async (userId, address, paymentType, initialStatus = 'received', locationData) => {
        return await monitor.trackPerformance('PlaceOrder', async () => {
          const { items, getTotal } = get();
          try {
            // Transform items for the RPC
            const rpcItems = items.map(item => ({
              product_id: item.productId,
              variant_id: item.variantId,
              quantity: item.quantity,
              category: item.category,
              price_at_time: item.price,
              subtotal: item.subtotal
            }));

            const { data, error } = await supabase.rpc('place_order_v1', {
              p_user_id: userId,
              p_address: address,
              p_total_amount: get().getGrandTotal(), // Use grand total including fee
              p_payment_type: paymentType,
              p_items: rpcItems,
              p_initial_status: initialStatus,
              p_latitude: locationData?.latitude,
              p_longitude: locationData?.longitude,
              p_formatted_address: locationData?.formattedAddress,
              p_city: locationData?.city,
              p_postal_code: locationData?.postalCode,
              p_landmark: locationData?.landmark,
              p_delivery_fee: get().deliveryFee // Pass the fee
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return data.order_id;
          } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            monitor.log('ERROR', 'Checkout', 'Order placement failed', { 
              message: errorMessage,
              stack: error.stack 
            });
            Alert.alert('Order Failed', errorMessage || 'Inventory check or connection failed.');
            return null;
          }
        });
      },
    }),
    {
      name: 'juice-shop-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
