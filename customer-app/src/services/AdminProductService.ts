import { supabase } from '../../lib/supabase';
import { Product } from '../types/product';

export const AdminProductService = {
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...product,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      // 1. Get product image URL first for cleanup
      const { data: product } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', id)
        .single();

      // 2. Delete image from storage if it exists and is a Supabase URL
      if (product?.image_url && product.image_url.includes('product-images')) {
        try {
          const path = product.image_url.split('product-images/')[1];
          if (path) {
            await supabase.storage
              .from('product-images')
              .remove([path]);
          }
        } catch (storageErr) {
          console.warn('[AdminProductService] Image cleanup failed:', storageErr);
          // Don't block product deletion if image cleanup fails
        }
      }

      // 3. Call the atomic Delete RPC
      const { data, error } = await supabase.rpc('delete_product_v1', { 
        p_product_id: id 
      });
      
      if (error) {
        console.error('[AdminProductService] RPC Deletion Error:', error);
        
        // Specific check for missing function error (42883)
        if (error.code === '42883') {
          throw new Error('SYSTEM_SETUP_REQUIRED: The deletion function is missing in your database. Please copy and run the script in "scripts/delete_product_rpc.sql" in your Supabase SQL Editor once.');
        }
        
        // Fallback: Try direct delete (will work if no order history exists)
        console.log('[AdminProductService] RPC failed, attempting direct delete fallback...');
        const { error: directError } = await supabase.from('products').delete().eq('id', id);
        if (directError) throw new Error(`Direct delete failed: ${directError.message}`);
      }

      if (data && !data.success) {
        console.warn('[AdminProductService] Business Logic Rejection:', data.message);
        throw new Error(data.message);
      }

      console.log(`[AdminProductService] Successfully purged product ${id}`);
    } catch (err: any) {
      console.error('[AdminProductService] Delete flow failed:', err);
      throw err;
    }
  },

  async bulkUpload(products: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const CHUNK_SIZE = 50;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE).map(p => ({
        ...p,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('products').insert(chunk);
      if (error) {
        console.error('Bulk upload chunk error:', error);
        failed += chunk.length;
      } else {
        success += chunk.length;
      }
    }

    return { success, failed };
  },

  getInventoryStats(products: Product[]) {
    return {
      totalProducts: products.length,
      totalStock: products.reduce((acc, p) => acc + (p.stock || 0), 0),
      inventoryValue: products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0),
      outOfStockCount: products.filter(p => p.stock <= 0).length,
      lowStockCount: products.filter(p => p.stock > 0 && p.stock < 10).length,
    };
  }
};
