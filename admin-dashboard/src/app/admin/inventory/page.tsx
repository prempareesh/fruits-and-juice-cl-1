"use client";
 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  RefreshCcw, 
  History,
  Filter,
  Search,
  CheckCircle2,
  Box,
  Loader2,
  XCircle
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '@/store/useStore';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  status: 'sufficient' | 'low' | 'critical';
  lastUpdated: string;
}

const InventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    low: 0,
    out: 0
  });

  useEffect(() => {
    setMounted(true);
    fetchInventory();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'products', callback: () => fetchInventory(true) }
  ]);

  const isFetching = React.useRef(false);

  const fetchInventory = async (isBackground = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (!isBackground) setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, stock_kg, created_at')
        .order('name');
      
      if (error) throw error;

      const formatted: InventoryItem[] = ((data as any[]) || []).map(p => {
        const stock = Number(p.stock_kg) || 0;
        let status: 'sufficient' | 'low' | 'critical' = 'sufficient';
        if (stock <= 2) status = 'critical';
        else if (stock < 10) status = 'low';

        return {
          id: p.id,
          name: p.name,
          category: p.category || 'General',
          stock: stock,
          unit: 'kg',
          status,
          lastUpdated: mounted ? formatDistanceToNow(new Date(p.created_at || new Date())) + ' ago' : 'Recently'
        };
      });

      setItems(formatted);

      setStats({
        total: formatted.length,
        low: formatted.filter(i => i.status === 'low').length,
        out: formatted.filter(i => i.stock <= 0).length
      });

    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleUpdateStock = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newStock = Math.max(0, item.stock + delta);
    if (newStock === item.stock) return;

    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_kg: newStock })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Stock Updated",
        description: `Successfully adjusted stock for ${item.name}.`,
        variant: "success",
      });
      fetchInventory();
    } catch (err: any) {
      console.error('Error updating stock:', err);
      toast({
        title: "Update Failed",
        description: "Failed to update stock. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedItems = filteredItems.slice(0, displayLimit);

  return (
    <AdminLayout>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Inventory Control</h1>
          <p className="text-slate-500 font-medium">Monitor live stock levels from your database</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <History size={18} />
            <span>Stock History</span>
          </button>
          <button 
            onClick={() => fetchInventory()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-premium p-6 border-l-8 border-emerald-500">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Total Catalog Items</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs mt-2">
            <CheckCircle2 size={14} />
            Database Synchronized
          </div>
        </div>
        <div className="card-premium p-6 border-l-8 border-amber-500">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Low Stock Alerts</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.low}</h3>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-2">
            <AlertTriangle size={14} />
            Threshold: &lt; 10kg
          </div>
        </div>
        <div className="card-premium p-6 border-l-8 border-rose-500">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Out of Stock</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.out}</h3>
          <div className="flex items-center gap-1 text-rose-500 font-bold text-xs mt-2">
            <AlertTriangle size={14} />
            Urgent Restock Needed
          </div>
        </div>
      </div>

      <div className="card-premium p-3 mb-8 flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search inventory items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-medium focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
          />
        </div>
        <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
          <Filter size={20} />
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Item Name</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Current Stock</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Last Activity</th>
                <th className="px-6 py-5 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ))
              ) : displayedItems.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <Box size={20} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-accent/30 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-black text-lg",
                        item.status === 'critical' ? "text-rose-500" : item.status === 'low' ? "text-amber-500" : "text-slate-900 dark:text-white"
                      )}>
                        {item.stock}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                      item.status === 'critical' ? "bg-rose-100 text-rose-600" : item.status === 'low' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {item.status === 'critical' || item.status === 'low' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {item.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 font-medium">{item.lastUpdated}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStock(item.id, 1)}
                        disabled={updatingId === item.id}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50"
                      >
                        {updatingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
                      </button>
                      <button 
                        onClick={() => handleUpdateStock(item.id, -1)}
                        disabled={updatingId === item.id || item.stock <= 0}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50"
                      >
                        {updatingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <ArrowDown size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination / Load More */}
      {!loading && displayedItems.length < filteredItems.length && (
        <div className="flex justify-center mt-8 pb-10">
          <button 
            onClick={() => setDisplayLimit(prev => prev + 10)}
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            Load More Items
          </button>
        </div>
      )}
    </AdminLayout>
  );
};

export default InventoryPage;
