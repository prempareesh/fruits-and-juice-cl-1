"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  MapPin, 
  Plus, 
  Trash2, 
  Save, 
  Locate,
  Navigation,
  Globe,
  Settings,
  AlertTriangle,
  Info
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchZonesAndSettings();
  }, []);

  const fetchZonesAndSettings = async () => {
    try {
      setLoading(true);
      const { data: zonesData } = await supabase.from('delivery_zones').select('*').order('min_distance');
      const { data: settingsData } = await supabase.from('store_settings').select('*').single();
      
      setZones(zonesData || []);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRadius = async (val: number) => {
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ max_delivery_radius: val })
        .eq('id', settings.id);
      
      if (error) throw error;
      toast({ title: "Settings Updated", variant: "success" });
      fetchZonesAndSettings();
    } catch (err) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const addZone = async () => {
    const newZone = { name: 'New Zone', min_distance: 0, max_distance: 5, delivery_fee: 40 };
    try {
      const { error } = await supabase.from('delivery_zones').insert([newZone]);
      if (error) throw error;
      fetchZonesAndSettings();
    } catch (err) {
      toast({ title: "Failed to add zone", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 pb-20">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Zones & Logic</h1>
            <p className="text-slate-500 font-medium mt-2">Define your shop's reach, delivery fees, and automatic geo-blocking rules.</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm flex items-center gap-2">
               <Locate size={18} /> Update Shop Location
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Zone Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Map size={20} className="text-primary" /> Active Zones
              </h2>
              <button 
                onClick={addZone}
                className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)
              ) : zones.map((zone, i) => (
                <motion.div 
                  key={zone.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card-premium p-6 flex flex-col md:flex-row items-center gap-6 group relative"
                >
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg">
                    {i + 1}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Zone Name</label>
                      <input 
                        value={zone.name} 
                        className="w-full bg-transparent border-b-2 border-slate-100 dark:border-slate-800 focus:border-primary outline-none font-black text-slate-800 dark:text-white transition-all pb-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Range (KM)</label>
                      <div className="flex items-center gap-2 font-black text-slate-800 dark:text-white">
                        <span>{zone.min_distance}km</span>
                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                        <span>{zone.max_distance}km</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Delivery Fee</label>
                      <span className="font-black text-lg text-primary">₹{zone.delivery_fee}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all">
                      <Save size={18} />
                    </button>
                    <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Master Delivery Guard */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Settings size={20} className="text-primary" /> Master Guard
            </h2>

            <div className="card-premium p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Service Radius</p>
                 <div className="flex items-baseline gap-2 mb-6">
                    <h3 className="text-6xl font-black">{settings?.max_delivery_radius || 5}</h3>
                    <span className="text-xl font-bold text-slate-400 uppercase">km</span>
                 </div>
                 
                 <div className="space-y-6">
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Orders beyond this radius will be **blocked automatically**. This is your absolute service boundary.
                    </p>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={settings?.max_delivery_radius || 5}
                      onChange={(e) => updateRadius(parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-500">
                       <span>1 KM</span>
                       <span>20 KM</span>
                    </div>
                 </div>
               </div>
               
               {/* Decorative Element */}
               <div className="absolute -bottom-10 -right-10 opacity-10">
                 <Globe size={200} />
               </div>
            </div>

            <div className="card-premium p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 flex gap-4">
               <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl h-fit">
                 <AlertTriangle size={20} className="text-amber-600" />
               </div>
               <div>
                 <h4 className="font-black text-amber-900 dark:text-amber-400 text-sm">Proximity Warning</h4>
                 <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 font-medium leading-relaxed">
                   Currently using **Haversine Math** for distance. Ensure your shop location (Lat/Long) is accurate in settings.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
