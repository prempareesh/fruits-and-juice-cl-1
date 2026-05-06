import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { monitor } from '../services/MonitoringService';
import { Product, JuiceVariant } from '../types';
import { ProductService } from '../services/ProductService';
import { supabase } from '../../lib/supabase';
import { Alert } from 'react-native';

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
  getTotal: () => number;
  placeOrder: (userId: string, address: string, paymentType: 'online' | 'cod', initialStatus?: string) => Promise<string | null>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return { items: [...state.items, newItem] };
        });
      },
      removeItem: (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
      placeOrder: async (userId, address, paymentType, initialStatus = 'received') => {
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
              p_total_amount: getTotal(),
              p_payment_type: paymentType,
              p_items: rpcItems,
              p_initial_status: initialStatus
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return data.order_id;
          } catch (error: any) {
            monitor.log('ERROR', 'Checkout', 'Order placement failed', { error });
            Alert.alert('Order Failed', error.message || 'Inventory check or connection failed.');
            return null;
          }
        });
      },
      },
    }),
    {
      name: 'juice-shop-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
