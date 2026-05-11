"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  MapPin, 
  Settings, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  Info,
  DollarSign,
  ArrowLeft,
  RefreshCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const DeliverySettingsPage = () => {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [config, setConfig] = useState({
    zone1_limit_km: 3,
    zone1_fee: 0,
    zone2_limit_km: 5,
    zone2_fee: 30,
    max_delivery_km: 5,
    is_enabled: true
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchConfig();
  }, [storeId]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_fee_configs')
        .select('*')
        .eq('store_id', storeId)
        .single();
      
      if (!error && data) {
        setConfig(data);
      }
    } catch (err) {
      console.error('Error fetching delivery config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    
    // Validation
    const newErrors = [];
    if (config.zone1_limit_km >= config.zone2_limit_km) {
      newErrors.push("Zone 2 limit must be greater than Zone 1 limit.");
    }
    if (config.zone2_limit_km > config.max_delivery_km) {
      newErrors.push("Max delivery range cannot be less than Zone 2 limit.");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_fee_configs')
        .upsert({
          store_id: storeId,
          ...config,
          updated_at: new Date()
        });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Settings</h1>
            <p className="text-xs lg:text-sm text-slate-500 font-medium">Configure distance-based fees and range</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {saving ? (
            <RefreshCcw className="animate-spin" size={20} />
          ) : success ? (
            <CheckCircle2 size={20} />
          ) : (
            <Save size={20} />
          )}
          <span>{success ? 'Saved Settings' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Config Card */}
          <div className="card-premium p-6 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Truck size={120} className="text-primary" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Delivery Fee Configuration</h3>
                <p className="text-sm text-slate-500 font-medium">Manage how delivery costs are calculated</p>
              </div>
            </div>

            {errors.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-sm font-bold"
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  {errors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              </motion.div>
            )}

            <div className="space-y-10">
              {/* Zone 1 */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black text-xs">Z1</div>
                    <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">Primary Zone</h4>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase px-2 py-1 bg-emerald-50 rounded-lg">Inner Circle</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Range (0 km → X km)</label>
                    <select 
                      value={config.zone1_limit_km}
                      onChange={(e) => setConfig({...config, zone1_limit_km: Number(e.target.value)})}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                    >
                      {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} km</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Fee</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        value={config.zone1_fee}
                        onChange={(e) => setConfig({...config, zone1_fee: Number(e.target.value)})}
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none appearance-none"
                      >
                        {[0, 10, 20, 30, 40, 50].map(v => <option key={v} value={v}>{v === 0 ? 'FREE' : `₹${v}`}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 2 */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs">Z2</div>
                    <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">Secondary Zone</h4>
                  </div>
                  <span className="text-[10px] font-black text-orange-500 uppercase px-2 py-1 bg-orange-50 rounded-lg">Outer Circle</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Range ({config.zone1_limit_km} km → X km)</label>
                    <select 
                      value={config.zone2_limit_km}
                      onChange={(e) => setConfig({...config, zone2_limit_km: Number(e.target.value)})}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                    >
                      {[2, 3, 4, 5, 6, 7, 8].map(v => (
                        <option key={v} value={v} disabled={v <= config.zone1_limit_km}>{v} km</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Fee</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        value={config.zone2_fee}
                        onChange={(e) => setConfig({...config, zone2_fee: Number(e.target.value)})}
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none appearance-none"
                      >
                        {[0, 10, 20, 30, 40, 50, 60, 80].map(v => <option key={v} value={v}>{v === 0 ? 'FREE' : `₹${v}`}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Max Range */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Maximum Delivery Radius</h4>
                    <p className="text-xs text-slate-500">Orders beyond this range will be blocked</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={config.zone2_limit_km} 
                    max="15" 
                    value={config.max_delivery_km}
                    onChange={(e) => setConfig({...config, max_delivery_km: Number(e.target.value)})}
                    className="w-32 lg:w-48 accent-primary" 
                  />
                  <span className="w-16 text-center py-2 bg-slate-900 text-white rounded-xl font-black text-sm">{config.max_delivery_km} km</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Status Card */}
          <div className="card-premium p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">System Status</h3>
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                config.is_enabled ? "bg-emerald-500" : "bg-slate-300"
              )} />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className={config.is_enabled ? "text-primary" : "text-slate-400"} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Delivery Active</span>
              </div>
              <button 
                onClick={() => setConfig({...config, is_enabled: !config.is_enabled})}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300 p-1",
                  config.is_enabled ? "bg-primary" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                  config.is_enabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>
            
            <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed">
              When disabled, customers will see a "Store Closed for Delivery" message in the app.
            </p>
          </div>

          {/* Live Preview */}
          <div className="card-premium p-8 bg-gradient-to-br from-primary/5 to-emerald-500/5">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">Live Fee Preview</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/20">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
                  <span>0 - {config.zone1_limit_km} km</span>
                  <span className="text-emerald-500 font-black">{config.zone1_fee === 0 ? 'FREE' : `₹${config.zone1_fee}`}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(config.zone1_limit_km / config.max_delivery_km) * 100}%` }} />
                </div>
              </div>
              
              <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/20">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
                  <span>{config.zone1_limit_km} - {config.zone2_limit_km} km</span>
                  <span className="text-orange-500 font-black">₹{config.zone2_fee}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-slate-200" style={{ width: `${(config.zone1_limit_km / config.max_delivery_km) * 100}%` }} />
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${((config.zone2_limit_km - config.zone1_limit_km) / config.max_delivery_km) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-rose-500">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase">Blocked above {config.max_delivery_km} km</span>
              </div>
            </div>
          </div>

          <div className="card-premium p-8">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
              Logic Explanation
            </h3>
            <div className="space-y-4 text-[11px] text-slate-500 font-medium leading-relaxed">
              <p>1. Distance is calculated using <strong>Google Maps API</strong> between store location and customer address.</p>
              <p>2. If distance ≤ {config.zone1_limit_km}km, fee = {config.zone1_fee === 0 ? 'FREE' : `₹${config.zone1_fee}`}.</p>
              <p>3. If {config.zone1_limit_km}km &lt; distance ≤ {config.zone2_limit_km}km, fee = ₹{config.zone2_fee}.</p>
              <p>4. If distance &gt; {config.max_delivery_km}km, order is blocked automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const IndianRupee = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className} 
    width={size} 
    height={size}
  >
    <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />
  </svg>
);

export default DeliverySettingsPage;
