import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { monitor } from '../services/MonitoringService';
import { Product, JuiceVariant } from '../types';
import { ProductService } from '../services/ProductService';
import { supabase } from '../../lib/supabase';
import { Alert, Platform } from 'react-native';
import { StructuredAddress, LocationService } from '../services/LocationService';
import { STORE_CONFIG } from '../constants/storeConfig';

export type AddressData = StructuredAddress;

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
  stock: number;
  size?: string;
}

interface CartStore {
  items: CartItem[];
  distance: number;
  selectedAddress: AddressData | null;
  isServiceable: boolean;
  isCheckingRadius: boolean;
  addItem: (product: Product, variant?: JuiceVariant, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  validateCartStock: () => Promise<boolean>;
  clearCart: () => void;
  deliveryFee: number;
  minOrderAmount: number;
  setSelectedAddress: (address: AddressData) => Promise<void>;
  updateDeliveryFee: (lat: number, lng: number) => Promise<number | void>;
  getTotal: () => number;
  getGrandTotal: () => number;
  placeOrder: (
    userId: string,
    address: string,
    paymentType: 'online' | 'cod',
    initialStatus?: string,
    locationData?: Partial<StructuredAddress>,
    customerName?: string,
    customerPhone?: string
  ) => Promise<string | null>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      // ── Real-time Product Deletion Sync ───────────────────────────
      // Automatically removes items from cart if they are deleted from DB
      supabase
        .channel('cart_deletion_sync')
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload) => {
          const deletedId = payload.old.id;
          if (deletedId) {
            set((state) => ({
              items: state.items.filter(item => item.productId !== deletedId)
            }));
            console.log(`[CART_SYNC] Product ${deletedId} was deleted from DB. Removed from cart.`);
          }
        })
        .subscribe();

      // ── Real-time Settings Sync ───────────────────────────
      // Instantly updates delivery fee, min order, and radius logic when admin changes settings
      supabase
        .channel('settings_realtime_sync')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.store_settings' },
          (payload) => {
            const newSettings = payload.new;
            console.log('[SETTINGS_SYNC] Admin settings updated. Refreshing logistics...');

            const selectedAddress = get().selectedAddress;
            if (selectedAddress) {
              get().updateDeliveryFee(selectedAddress.latitude, selectedAddress.longitude);
            } else {
              set({
                deliveryFee: Number(newSettings.delivery_fee ?? newSettings.base_delivery_fee ?? 0),
                minOrderAmount: Number(newSettings.minimum_order ?? newSettings.min_order_amount ?? 0)
              });
            }
          }
        )
        .subscribe();

      return {
        items: [],
        distance: 0,
        deliveryFee: 0,
        minOrderAmount: 0,
        selectedAddress: null,
        isServiceable: true,
        isCheckingRadius: false,
        addItem: (product, variant, quantity = 1) => {
          try {
            const isJuice = product.category?.toLowerCase().includes('juice');
            const variantId = variant?.id;
            const price = ProductService.getPrice(product, variant);
            const cartItemId = isJuice ? `${product.id}-${variantId}` : product.id;

            // Mandatory Stock Check
            const currentStock = product.stock || 0;
            if (currentStock <= 0) {
              Alert.alert("Out of Stock", "This item is currently unavailable.");
              return;
            }

            set((state) => {
              const existingItem = state.items.find((item) => item.id === cartItemId);

              if (existingItem) {
                const newQty = existingItem.quantity + quantity;
                if (newQty > currentStock) {
                  Alert.alert("Stock Limit", `Only ${currentStock} items available for ${product.name}.`);
                  return state;
                }
                return {
                  items: state.items.map((item) =>
                    item.id === cartItemId
                      ? { ...item, quantity: newQty, subtotal: newQty * price, stock: currentStock }
                      : item
                  )
                };
              }

              if (quantity > currentStock) {
                Alert.alert("Stock Limit", `Only ${currentStock} items available.`);
                return state;
              }

              const newItem: CartItem = {
                id: cartItemId,
                productId: product.id,
                name: product.name,
                category: product.category as any,
                variantId,
                variantName: variant?.variant_type,
                quantity,
                price,
                subtotal: price * quantity,
                image: product.image_url,
                stock: currentStock,
                size: isJuice ? (product.quantity || '300ml') : product.quantity,
              };
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              return { items: [...state.items, newItem] };
            });
          } catch (err) {
            console.error('[CART_ERROR] addItem failed:', err);
          }
        },
        removeItem: (id) => {
          set((state) => {
            const existingItem = state.items.find((item) => item.id === id);
            if (!existingItem) return state;

            if (existingItem.quantity > 1) {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              return {
                items: state.items.map((item) =>
                  item.id === id
                    ? { ...item, quantity: item.quantity - 1, subtotal: (item.quantity - 1) * item.price }
                    : item
                )
              };
            }

            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return {
              items: state.items.filter((item) => item.id !== id)
            };
          });
        },
        updateQuantity: (id, quantity) => {
          if (quantity <= 0) {
            get().removeItem(id);
            return;
          }
          set((state) => {
            const item = state.items.find(i => i.id === id);
            if (item && quantity > item.stock) {
              Alert.alert("Stock Limit", `Only ${item.stock} items available.`);
              return state;
            }
            return {
              items: state.items.map((item) =>
                item.id === id
                  ? { ...item, quantity, subtotal: quantity * item.price }
                  : item
              )
            };
          });
        },
        validateCartStock: async () => {
          const { items } = get();
          if (items.length === 0) return true;

          try {
            const productIds = items.map(i => i.productId);
            const { data, error } = await supabase
              .from('products')
              .select('id, stock, name')
              .in('id', productIds);

            if (error) throw error;

            const stockMap = data.reduce((acc: any, p) => {
              acc[p.id] = p.stock;
              return acc;
            }, {});

            let itemsAdjusted = false;
            const updatedItems = items.map(item => {
              const availableStock = stockMap[item.productId] || 0;
              if (item.quantity > availableStock) {
                itemsAdjusted = true;
                return {
                  ...item,
                  quantity: availableStock,
                  subtotal: availableStock * item.price,
                  stock: availableStock
                };
              }
              return { ...item, stock: availableStock };
            }).filter(item => item.quantity > 0);

            if (itemsAdjusted) {
              set({ items: updatedItems });
              Alert.alert(
                "Stock Updated",
                "Some items in your cart were updated or removed because they are no longer in stock."
              );
              return false;
            }
            return true;
          } catch (err) {
            console.error('[CART_SYNC] Stock validation failed:', err);
            return true; // Proceed with caution if validation fails
          }
        },
        clearCart: () => set({ items: [], deliveryFee: 0, distance: 0 }),
        getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
        getGrandTotal: () => get().getTotal() + get().deliveryFee,
        setSelectedAddress: async (addr: AddressData) => {
          set({ selectedAddress: addr, isCheckingRadius: true });

          // Persist to Supabase if logged in
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              console.log('[CART_SYNC] Persisting address to profile:', user.id);
              await supabase.from('profiles').update({
                address: addr.formattedAddress,
                updated_at: new Date().toISOString()
              }).eq('id', user.id);
            }
          } catch (syncErr) {
            console.warn('[CART_SYNC] Failed to persist address to DB', syncErr);
          }

          if (addr.latitude && addr.longitude) {
            try {
              await get().updateDeliveryFee(addr.latitude, addr.longitude);
            } catch (err) {
              console.warn('[LOGISTICS_ERROR] Address outside radius');
            }
          }
          set({ isCheckingRadius: false });
        },
        updateDeliveryFee: async (lat, lng) => {
          try {
            const { data: settings } = await supabase
              .from('settings')
              .select('*')
              .eq('id', 'store_settings')
              .maybeSingle();

            const shopLat = Number(settings?.latitude || settings?.store_lat);
            const shopLng = Number(settings?.longitude || settings?.store_lng);
            const maxRadius = Number(settings?.service_radius_km || settings?.delivery_radius || 10);
            const minAmount = Number(settings?.minimum_order || settings?.min_order_amount || 0);

            if (!shopLat || !shopLng) {
              console.error('[LOGISTICS] Error: Store coordinates not found in settings.');
              return;
            }

            const dist = LocationService.calculateDistance(shopLat, shopLng, lat, lng);

            console.log('--- [CART_LOGISTICS_DEBUG] ---');
            console.log(`STORE_COORDS: ${shopLat}, ${shopLng}`);
            console.log(`USER_COORDS: ${lat}, ${lng}`);
            console.log(`ADMIN_RADIUS: ${maxRadius} km`);
            console.log(`CALCULATED_DISTANCE: ${dist} km`);
            console.log('------------------------------');

            set({ distance: dist, minOrderAmount: minAmount });

            if (dist > maxRadius) {
              set({ deliveryFee: 0, isServiceable: false });
              throw new Error(`Out of delivery range. Our max radius is ${maxRadius}km.`);
            }

            const fee = Number(settings?.delivery_fee || settings?.base_delivery_fee || 0);
            set({ deliveryFee: fee, isServiceable: true });
            return fee;
          } catch (err: any) {
            set({ deliveryFee: 0, isServiceable: false });
            throw err;
          }
        },
        placeOrder: async (userId, address, paymentType, initialStatus = 'PENDING', locationData, customerName, customerPhone) => {
          return await monitor.trackPerformance('PlaceOrder', async () => {
            const { items, deliveryFee, distance } = get();
            try {
              const rpcItems = items.map(item => {
                // Only send variant_id if it looks like a valid UUID (36 chars)
                // Frontend-only strings like 'classic' or 'pure' will be sent as null to avoid DB crash
                const isUuid = item.variantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.variantId);

                return {
                  product_id: item.productId,
                  variant_id: isUuid ? item.variantId : null,
                  quantity: item.quantity,
                  price_at_time: item.price,
                  subtotal: item.subtotal
                };
              });

              const payload = {
                p_user_id: userId,
                p_address: address,
                p_total_amount: get().getGrandTotal(),
                p_payment_type: paymentType,
                p_items: rpcItems,
                p_initial_status: initialStatus,
                p_latitude: locationData?.latitude || 0,
                p_longitude: locationData?.longitude || 0,
                p_distance_km: distance,
                p_delivery_fee: deliveryFee,
                p_customer_name: customerName,
                p_customer_phone: customerPhone
              };

              // ── PROFILE INTEGRITY CHECK ──────────────────────────
              // Ensures a profile exists to prevent FK violation 23503.
              try {
                const { data: profile, error: profileCheckError } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', userId)
                  .maybeSingle();

                if (!profile || profileCheckError) {
                  console.log('[CART_CHECKOUT] Profile missing, creating entry for:', userId);
                  await supabase.from('profiles').upsert({
                    id: userId,
                    full_name: customerName || 'Customer',
                    role: 'customer',
                    updated_at: new Date().toISOString()
                  });
                }
              } catch (err) {
                console.warn('[CART_CHECKOUT] Profile sync warning:', err);
              }

              console.log('[RPC_PRE-FLIGHT] Calling place_order_v2 with payload:', JSON.stringify(payload, null, 2));

              const { data, error } = await supabase.rpc('place_order_v2', payload);

              if (error) {
                console.error('[RPC_ERROR]', error);
                let friendlyMessage = error.message;
                if (error.code === '23503') friendlyMessage = "Profile sync error. Please try again.";
                if (error.message?.includes('not found')) friendlyMessage = "Database sync required. Please contact support.";

                throw new Error(`${friendlyMessage} (Code: ${error.code})`);
              }

              if (!data || !data.success) {
                throw new Error(data?.message || 'Order placement failed on server.');
              }

              const newOrderId = data.order_id;
              console.log('[RPC_SUCCESS] Order created:', newOrderId);

              // ── TRIGGER NOTIFICATIONS (NON-BLOCKING) ──────────────────────────────────
              try {
                const rawApiURL = process.env.EXPO_PUBLIC_API_URL || 'https://freshflow-backend-x29k.onrender.com';
                const apiURL = rawApiURL.replace(/\/api\/payment\/?$/, '').replace(/\/$/, '');
                console.log('[Notification_Debug] Triggering alert via:', apiURL);

                fetch(`${apiURL}/api/notification/send-order`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderData: {
                      id: newOrderId,
                      customerName: customerName || 'Guest',
                      customerPhone: customerPhone || 'N/A',
                      address: address,
                      latitude: locationData?.latitude || 0,
                      longitude: locationData?.longitude || 0,
                      landmark: locationData?.landmark || '',
                      items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                      total: payload.p_total_amount,
                      paymentType: paymentType,
                      createdAt: new Date().toISOString()
                    }
                  })
                })
                .then(async (response) => {
                  if (!response.ok) {
                    const errorText = await response.text();
                    console.warn('[Notification_Error] Server responded with error:', response.status, errorText);
                  } else {
                    const resData = await response.json();
                    console.log('[Notification_Success] Server acknowledged notification:', resData);
                  }
                })
                .catch((notifyErr) => {
                  console.warn('[Notification_Network_Error] Failed to reach notification server:', notifyErr.message);
                });
              } catch (notifyErr: any) {
                console.warn('[Notification_Network_Error] Failed to trigger background fetch:', notifyErr.message);
              }

              if (Platform.OS !== 'web') {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch { }
              }

              return newOrderId;
            } catch (error: any) {
              console.error('[ORDER_CRITICAL_FAILURE]', error);
              Alert.alert('Order Placement Failed', error.message);
              return null;
            }
          });
        },
      };
    },
    {
      name: 'juice-shop-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        return (state, error) => {
          if (state) {
            // Fetch fresh settings on rehydration (app launch)
            supabase
              .from('settings')
              .select('*')
              .eq('id', 'store_settings')
              .maybeSingle()
              .then(({ data }) => {
                if (data) {
                  console.log('[CART_INIT] Settings re-fetched from DB.');
                  state.deliveryFee = Number(data.delivery_fee ?? data.base_delivery_fee ?? 0);
                  state.minOrderAmount = Number(data.minimum_order ?? data.min_order_amount ?? 0);
                }
              });
          }
        };
      },
    }
  )
);
