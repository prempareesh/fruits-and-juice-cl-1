"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Package,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/store/useStore';

interface Product {
  id: string;
  name: string;
  category: string;
  price_per_kg: number;
  stock_kg: number;
  image_url: string;
  is_available: boolean;
}

const ProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'products', callback: () => fetchProducts(true) }
  ]);

  const isFetching = React.useRef(false);

  const fetchProducts = async (isBackground = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (!isBackground) setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price_per_kg, stock_kg, image_url, is_available')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== id));
      toast({
        title: "Product Deleted",
        description: "The product has been successfully removed from the catalog.",
        variant: "success",
      });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const displayedProducts = filteredProducts.slice(0, displayLimit);

  const ProductCardMobile = React.memo(({ product }: { product: Product }) => (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="card-premium p-4 mb-4"
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white truncate">{product.name}</h4>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{product.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Price</p>
              <p className="font-black text-slate-900 dark:text-white">₹{product.price_per_kg}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Stock</p>
              <p className={cn(
                "font-black",
                product.stock_kg < 10 ? "text-rose-500" : "text-slate-900 dark:text-white"
              )}>{product.stock_kg} Units</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
          className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2"
        >
          <Edit size={14} /> Edit
        </button>
        <button 
          onClick={() => handleDeleteProduct(product.id)}
          disabled={deletingId === product.id}
          className="px-4 py-2.5 bg-rose-50 rounded-xl text-rose-500 disabled:opacity-50"
        >
          {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </motion.div>
  ));

  return (
    <AdminLayout>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Products</h1>
          <p className="text-xs lg:text-sm text-slate-500 font-medium">Catalog & Inventory control</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 flex items-center justify-center gap-2 font-bold text-xs">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => router.push('/admin/products/add')}
            className="flex-1 md:flex-none p-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="card-premium p-3 flex-1 flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-medium focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="card-premium p-3 sm:w-64">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden lg:block card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Product</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Pricing</th>
                <th className="px-6 py-5">Stock</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                    </td>
                  </tr>
                ))
              ) : displayedProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={product.image_url} className="w-10 h-10 rounded-xl object-cover" />
                      <span className="font-bold text-slate-800 dark:text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-accent/50 text-primary rounded-full text-[10px] font-black uppercase">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900 dark:text-white">₹{product.price_per_kg}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-black",
                      product.stock_kg < 10 ? "text-rose-500" : "text-slate-800 dark:text-white"
                    )}>{product.stock_kg} Units</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      product.is_available ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deletingId === product.id}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === product.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="lg:hidden">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-3xl mb-4 animate-pulse" />)
        ) : displayedProducts.map(product => (
          <ProductCardMobile key={product.id} product={product} />
        ))}
        
        {/* Mobile FAB for Add Product */}
        <button 
          onClick={() => router.push('/admin/products/add')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center z-30 active:scale-90 transition-transform"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Pagination / Load More */}
      {!loading && displayedProducts.length < filteredProducts.length && (
        <div className="flex justify-center mt-8 pb-10">
          <button 
            onClick={() => setDisplayLimit(prev => prev + 10)}
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            Load More Products
          </button>
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductsPage;
