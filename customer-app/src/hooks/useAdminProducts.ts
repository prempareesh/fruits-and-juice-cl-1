import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../types/product';
import { AdminProductService } from '../services/AdminProductService';

export const useAdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminProductService.getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    // Setup Realtime Sync
    const channel = supabase
      .channel('admin_products_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  return {
    products,
    setProducts,
    loading,
    error,
    refresh: fetchProducts,
    stats: AdminProductService.getInventoryStats(products)
  };
};
