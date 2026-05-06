import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, safeQuery } from '../../lib/supabase';
import { Product } from '../types';
import { monitor } from '../services/MonitoringService';
import { ProductService } from '../services/ProductService';

const PAGE_SIZE = 12;

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      pageRef.current = 0;
      setHasMore(true);
    }
    
    if (!hasMore && !isRefresh) return;

    try {
      if (isRefresh) setRefreshing(true);
      else if (pageRef.current === 0) setLoading(true);
      
      setError(null);

      await monitor.trackPerformance('FetchProducts', async () => {
        const from = pageRef.current * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error: supabaseError } = await safeQuery(() => 
          supabase
            .from('products')
            .select('*')
            .range(from, to)
            .order('id', { ascending: true })
        );

        if (supabaseError) throw supabaseError;

        if (data) {
          setProducts(prev => isRefresh ? data : [...prev, ...data]);
          setHasMore(data.length === PAGE_SIZE);
          pageRef.current += 1;
          
          // Background prefetch for cinematic performance
          ProductService.prefetchImages(data);
        }
      });
    } catch (err: any) {
      monitor.log('ERROR', 'useProducts', 'Fetch failed', { err });
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasMore]);

  useEffect(() => {
    fetchProducts();

    const channelId = `products-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  return {
    products,
    loading,
    refreshing,
    error,
    hasMore,
    loadMore: () => fetchProducts(false),
    refresh: () => fetchProducts(true),
    retry: () => fetchProducts(false),
  };
};
