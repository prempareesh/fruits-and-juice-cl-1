import { Image } from 'react-native';
import { monitor } from './MonitoringService';
import { Product, JuiceVariant } from '../types';

/**
 * ProductService
 * Centralized logic for pricing and product formatting across the app.
 * Prevents hardcoded pricing mismatches.
 */
export const ProductService = {
  /**
   * Calculates the display price for a product.
   * For juices: Priority is Variant Price > Base Price > 0
   * For fruits: Priority is Price Per Kg > Base Price > 0
   */
  getPrice: (product: any, variant?: any): number => {
    if (!product) return 0;
    
    // For Juices: Priority is Variant Price -> Product Price -> Default 70
    if (product.category === 'juice') {
      return variant?.price || product.price || 70;
    }
    
    // For Fruits: Priority is Price Per Kg -> Product Price -> Default 80
    return product.price_per_kg || product.price || 80;
  },

  /**
   * Transforms a raw Supabase URL into a CDN-optimized URL with transformations.
   * Also handles legacy localhost URLs from early development by providing safe fallbacks.
   */
  getOptimizedImage: (url?: string, width: number = 400, quality: number = 80): string => {
    if (!url) return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400';
    
    // Handle legacy localhost images from local DB seeds
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      // Fallback to a high-quality product placeholder to avoid ERR_CONNECTION_REFUSED
      return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400';
    }

    if (url.includes('supabase.co')) {
      const isRenderUrl = url.includes('/render/image/public/');
      if (isRenderUrl) return `${url}&width=${width}&quality=${quality}`;
      return url.replace('/storage/v1/object/public/', `/storage/v1/render/image/public/`) + `?width=${width}&quality=${quality}&resize=contain`;
    }
    return url;
  },

  /**
   * Prefetch critical images to ensure instant UI transitions
   */
  prefetchImages: async (products: Product[]) => {
    const urls = products.map(p => ProductService.getOptimizedImage(p.image_url, 600));
    try {
      await Promise.all(urls.map(url => Image.prefetch(url)));
      monitor.log('INFO', 'Asset', `Prefetched ${urls.length} images`);
    } catch (err) {
      monitor.log('WARN', 'Asset', 'Image prefetch failed', { err });
    }
  },

  /**
   * Formats a numeric price into the local currency string.
   * Example: 70 -> ₹70
   */
  formatPrice: (price: number): string => {
    return `₹${Math.round(price).toLocaleString('en-IN')}`;
  },

  /**
   * Returns a "Starts From" price string for products with variants.
   */
  getDisplayPriceRange: (product: Product): string => {
    const basePrice = product.price || product.price_per_kg || 0;
    return `₹${Math.round(basePrice)}`;
  }
};
