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
  const hasMoreRef = useRef(true);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      pageRef.current = 0;
      hasMoreRef.current = true;
      setHasMore(true);
    }
    
    if (!hasMoreRef.current && !isRefresh) return;

    try {
      if (isRefresh) setRefreshing(true);
      else if (pageRef.current === 0) setLoading(true);
      
      setError(null);

      // Add a timeout for the fetch operation
      const fetchPromise = monitor.trackPerformance('FetchProducts', async () => {
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
          console.log(`[useProducts] Fetched ${data.length} products`);
          setProducts(prev => isRefresh ? data : [...prev, ...data]);
          const nextHasMore = data.length === PAGE_SIZE;
          hasMoreRef.current = nextHasMore;
          setHasMore(nextHasMore);
          pageRef.current += 1;
          
          ProductService.prefetchImages(data);
        }
      });

      // 10-second safety timeout for the data fetch
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network request timed out')), 10000)
      );

      await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err: any) {
      monitor.log('ERROR', 'useProducts', 'Fetch failed', { err });
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
