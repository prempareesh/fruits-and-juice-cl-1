import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface StoreSettings {
  store_live: boolean;
  service_radius_km: number;
  minimum_order: number;
  delivery_fee: number;
  warehouse_address: string;
  latitude: number;
  longitude: number;
  support_phone: string;
  delivery_time: string;
  // Legacy aliases for backward compatibility during transition
  store_open?: boolean;
  delivery_radius?: number;
  min_order_amount?: number;
  base_delivery_fee?: number;
  store_address?: string;
  store_lat?: number;
  store_lng?: number;
  estimated_delivery_time?: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const mapSettings = (data: any): StoreSettings => {
    return {
      store_live: data.store_live ?? data.store_open ?? true,
      service_radius_km: data.service_radius_km ?? data.delivery_radius ?? 10,
      minimum_order: data.minimum_order ?? data.min_order_amount ?? 100,
      delivery_fee: data.delivery_fee ?? data.base_delivery_fee ?? 20,
      warehouse_address: data.warehouse_address ?? data.store_address ?? '',
      latitude: data.latitude ?? data.store_lat ?? null,
      longitude: data.longitude ?? data.store_lng ?? null,
      support_phone: data.support_phone ?? '',
      delivery_time: data.delivery_time ?? data.estimated_delivery_time ?? '30-45 mins'
    };
  };

  useEffect(() => {
    fetchSettings();

    const channelId = `settings_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'settings', 
          filter: 'id=eq.store_settings' 
        },
        (payload) => {
          if (payload.new) {
            setSettings(mapSettings(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'store_settings')
        .single();

      if (!error && data) {
        setSettings(mapSettings(data));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return { 
    settings, 
    loading, 
    isClosed: settings ? settings.store_live === false : false 
  };
}
