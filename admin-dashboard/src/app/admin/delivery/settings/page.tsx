"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Settings2, 
  Save, 
  Truck, 
  Navigation, 
  Zap, 
  Globe,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamically import MapPicker to prevent SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/delivery/MapPicker'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-3xl">Loading Map...</div>
});

export default function DeliverySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    shop_latitude: 19.0760,
    shop_longitude: 72.8777,
    shop_address: '',
    max_delivery_radius: 5,
    free_delivery_radius: 3,
    delivery_fee: 30,
    is_delivery_enabled: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          shop_latitude: data.shop_latitude || 19.0760,
          shop_longitude: data.shop_longitude || 72.8777,
          shop_address: data.shop_address || '',
          max_delivery_radius: data.max_delivery_radius || 5,
          free_delivery_radius: data.free_delivery_radius || 3,
          delivery_fee: data.delivery_fee || 30,
          is_delivery_enabled: data.is_delivery_enabled ?? true
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          id: (await supabase.from('store_settings').select('id').single()).data?.id || undefined,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your delivery configuration has been updated globally.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Settings</h1>
            <p className="text-slate-500 font-medium mt-1">Configure your shop hub and logistics perimeter</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Globe className="animate-spin" size={16} /> : <Save size={16} />}
            SAVE CONFIGURATION
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Map */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-0 overflow-hidden h-[500px]">
              <MapPicker 
                initialCenter={[settings.shop_latitude, settings.shop_longitude]}
                radiusKm={settings.max_delivery_radius}
                onLocationSelect={(lat, lng, addr) => {
                  setSettings(prev => ({ 
                    ...prev, 
                    shop_latitude: lat, 
                    shop_longitude: lng,
                    shop_address: addr || prev.shop_address 
                  }));
                }}
              />
            </div>

            <div className="card-premium p-6 flex items-center gap-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide">Dynamic Geo-Fencing Active</h4>
                <p className="text-xs text-slate-500 font-medium">Orders outside the {settings.max_delivery_radius}km radius will be automatically blocked at checkout.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="space-y-6">
            <div className="card-premium p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 size={18} className="text-primary" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Logistics Controls</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Shop Address</label>
                  <textarea 
                    value={settings.shop_address}
                    onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-primary outline-none min-h-[80px]"
                    placeholder="Enter shop address..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Max Radius (km)</label>
                    <input 
                      type="number"
                      value={settings.max_delivery_radius}
                      onChange={(e) => setSettings({ ...settings, max_delivery_radius: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Free Radius (km)</label>
                    <input 
                      type="number"
                      value={settings.free_delivery_radius}
                      onChange={(e) => setSettings({ ...settings, free_delivery_radius: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Standard Delivery Fee (₹)</label>
                  <input 
                    type="number"
                    value={settings.delivery_fee}
                    onChange={(e) => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm font-black text-primary"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-2 italic">*Applied to orders between {settings.free_delivery_radius}km and {settings.max_delivery_radius}km.</p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className={settings.is_delivery_enabled ? "text-emerald-500" : "text-slate-300"} />
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Delivery Service</span>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, is_delivery_enabled: !settings.is_delivery_enabled })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        settings.is_delivery_enabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        settings.is_delivery_enabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-premium p-6 border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent flex flex-col items-center text-center">
              <Navigation size={32} className="text-slate-300 mb-4" />
              <h5 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Realtime Sync</h5>
              <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">Changes saved here are instantly broadcasted to all customer apps without requiring a refresh.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
