"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  MapPin, 
  ChevronRight, 
  Plus, 
  Search,
  Activity,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useStore';

interface StoreData {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
}

const StoresPage = () => {
  const router = useRouter();
  const { setCurrentStore } = useAppStore();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase.from('stores').select('*');
    if (!error && data) setStores(data);
    setLoading(false);
  };

  const handleSelectStore = (store: StoreData) => {
    setCurrentStore(store as any);
    router.push(`/admin/store/${store.id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-10 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header - Mobile Centered */}
        <div className="text-center mb-10 lg:mb-12">
          <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-primary/20 mx-auto mb-6">
            <Store className="text-white" size={32} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Select Store</h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium px-4">Choose a location to manage your juicy business</p>
        </div>

        {/* Search - Mobile Full Width */}
        <div className="card-premium p-3 mb-8 flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by city or branch..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
            <Plus size={20} />
          </button>
        </div>

        {/* Store Grid - Mobile List */}
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          {loading ? (
            [1, 2].map(i => (
              <div key={i} className="card-premium p-6 animate-pulse flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))
          ) : stores.map((store) => (
            <motion.div
              key={store.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectStore(store)}
              className="card-premium p-5 lg:p-6 cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4 lg:gap-6">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Store size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white">{store.name}</h3>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs lg:text-sm text-slate-500 font-bold flex items-center gap-1">
                      <MapPin size={14} className="text-rose-500" />
                      {store.location}
                    </p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <p className="text-[10px] lg:text-xs font-black text-primary uppercase tracking-widest">Active Branch</p>
                  </div>
                </div>
              </div>
              <div className="p-3 lg:p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <ArrowRight size={20} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="text-center mt-10">
          <button className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
            Request New Branch Access
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StoresPage;
