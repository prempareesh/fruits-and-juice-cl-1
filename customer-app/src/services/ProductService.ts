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
    
    // 1. Variant price logic
    if (variant) {
      if (variant.price) return variant.price;
      
      const basePrice = product.selling_price || product.price || 70;
      
      // Dynamic logic for juice variants (Classic vs Pure)
      if (variant.id === 'classic' || variant.variant_type === 'normal') {
        return product.classic_price !== null && product.classic_price !== undefined && product.classic_price !== ''
          ? parseFloat(product.classic_price)
          : basePrice;
      }
      
      if (variant.id === 'pure' || variant.variant_type === 'very_pure') {
        return product.pure_price !== null && product.pure_price !== undefined && product.pure_price !== ''
          ? parseFloat(product.pure_price)
          : basePrice; // Fallback safely to normal selling price
      }
      
      return basePrice;
    }

    // 2. New selling_price field takes priority for base product
    if (product.selling_price) return product.selling_price;

    // 3. Legacy fallbacks
    if (product.category?.toLowerCase().includes('juice')) {
      return product.price || 70;
    }
    return product.price_per_kg || product.price || 80;
  },

  /**
   * Transforms a raw Supabase URL into a CDN-optimized URL with transformations.
   * Also handles legacy localhost URLs from early development by providing safe fallbacks.
   */
  getOptimizedImage: (url?: string, width: number = 400, quality: number = 80): string => {
    const FALLBACK = 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400';

    if (!url) return FALLBACK;

    // Reject blurhash strings, base64, relative paths — only accept http/https URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) return FALLBACK;

    // Handle legacy localhost images from local DB seeds
    if (url.includes('localhost') || url.includes('127.0.0.1')) return FALLBACK;

    if (url.includes('supabase.co')) {
      const isRenderUrl = url.includes('/render/image/public/');
      if (isRenderUrl) return `${url}&width=${width}&quality=${quality}`;
      return url.replace('/storage/v1/object/public/', `/storage/v1/render/image/public/`) + `?width=${width}&quality=${quality}&resize=contain`;
    }

    if (url.includes('images.unsplash.com')) {
      // Remove existing w parameter if any and append requested one
      const cleanUrl = url.split('?')[0];
      return `${cleanUrl}?w=${width}&q=${quality}&fit=crop&auto=format`;
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
    const price = ProductService.getPrice(product);
    return `₹${Math.round(price)}`;
  }
};
