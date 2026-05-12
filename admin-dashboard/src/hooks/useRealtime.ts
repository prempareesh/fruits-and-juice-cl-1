"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeConfig = {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
};

/**
 * useRealtime hook for optimized Supabase Realtime subscriptions.
 * Prevents duplicate listeners and ensures clean cleanup.
 */
export function useRealtime(configs: RealtimeConfig[]) {
  const configsRef = useRef(configs);
  
  // Keep configs updated without re-triggering effect if possible
  useEffect(() => {
    configsRef.current = configs;
  }, [configs]);

  useEffect(() => {
    const channelName = `db-changes-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);

    configs.forEach((_, index) => {
      channel.on(
        'postgres_changes',
        {
          event: configs[index].event || '*',
          schema: configs[index].schema || 'public',
          table: configs[index].table,
          filter: configs[index].filter,
        },
        (payload) => {
          // Always use the latest callback from the current configs
          configsRef.current[index]?.callback(payload);
        }
      );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Subscribed successfully
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Only run once on mount
}
