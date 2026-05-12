"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Layers, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  MoreVertical,
  Loader2,
  AlertCircle,
  X,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useStore';

interface Category {
  id: string;
  name: string;
  image_url: string;
  description: string;
  item_count?: number;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({ name: '', image_url: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'categories', callback: () => fetchCategories(true) },
    { table: 'products', callback: () => fetchCategories(true) }
  ]);

  const fetchCategories = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      // FALLBACK TO HARDCODED IF TABLE MISSING
      let catData = data || [];
      if (catError && catError.code === 'PGRST205') {
        catData = [
          { id: '1', name: 'fruit', description: 'Fresh seasonal fruits', image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400' },
          { id: '2', name: 'juice', description: 'Pure natural juices', image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400' }
        ];
      } else if (catError) {
        throw catError;
      }

      // Get counts for each category from products table
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('category');

      if (prodError) throw prodError;

      const counts = products.reduce((acc: any, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
      }, {});

      const formatted = catData.map(cat => ({
        ...cat,
        item_count: counts[cat.name] || 0
      }));

      setCategories(formatted);
      
      // Update selected category if it exists in the new data
      if (selectedCategory) {
        const updated = formatted.find(c => c.id === selectedCategory.id);
        if (updated) setSelectedCategory(updated);
      } else if (formatted.length > 0) {
        setSelectedCategory(formatted[0]);
      }
    } catch (err: any) {
      console.error('Error:', err);
      if (!isBackground) setError('Using local category configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', image_url: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setModalMode('edit');
    setFormData({ name: cat.name, image_url: cat.image_url, description: cat.description });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const { error: addError } = await supabase
          .from('categories')
          .insert([formData]);
        if (addError) throw addError;
        toast({ title: 'Category added!', variant: 'success' });
      } else {
        const { error: editError } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', selectedCategory?.id);
        if (editError) throw editError;
        toast({ title: 'Category updated!', variant: 'success' });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will not delete products, but they will become uncategorized.')) return;
    try {
      const { error: delError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (delError) throw delError;
      toast({ title: 'Category removed', variant: 'success' });
      if (selectedCategory?.id === id) setSelectedCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Categories</h1>
          <p className="text-slate-500 font-medium">Organize your products into logical groups</p>
        </div>
        
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600 font-bold">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Categories List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Categories</h3>
            {!loading && <span className="text-[10px] font-black text-primary px-3 py-1 bg-accent/50 rounded-full uppercase">{categories.length} Total</span>}
          </div>
          
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl animate-pulse" />
            ))
          ) : (
            categories.map((cat) => (
              <motion.div
                key={cat.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "p-4 rounded-[2rem] cursor-pointer transition-all border-2",
                  selectedCategory?.id === cat.id
                    ? "bg-white dark:bg-slate-900 border-primary shadow-xl shadow-primary/5"
                    : "bg-white/50 dark:bg-slate-900/50 border-transparent hover:bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                      <img src={cat.image_url || 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=100'} className="w-full h-full object-cover" alt={cat.name} />
                    </div>
                    <div>
                      <p className={cn(
                        "font-black transition-colors",
                        selectedCategory?.id === cat.id ? "text-primary" : "text-slate-800 dark:text-slate-200"
                      )}>
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{cat.item_count} Products</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className={cn(
                    "transition-colors",
                    selectedCategory?.id === cat.id ? "text-primary" : "text-slate-300"
                  )} />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Subcategories/Details Detail View */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {selectedCategory ? (
              <motion.div 
                key={selectedCategory.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card-premium p-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10">
                      <img src={selectedCategory.image_url || 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200'} className="w-full h-full object-cover" alt={selectedCategory.name} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedCategory.name}</h2>
                      <p className="text-sm text-slate-500 font-medium">Global category control</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleOpenEditModal(selectedCategory)}
                      className="flex-1 sm:flex-none p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedCategory.id)}
                      className="flex-1 sm:flex-none p-3.5 bg-rose-50 rounded-2xl text-rose-500 hover:bg-rose-100 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-slate-800 dark:text-slate-200 mb-4 uppercase text-[10px] tracking-widest">Description</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {selectedCategory.description || 'No description provided for this category. Add one to help organize your catalog better.'}
                  </p>
                </div>

                <div className="mt-10 p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-accent/50 rounded-2xl flex items-center justify-center text-primary mb-4">
                    <Layers size={24} />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Category Insights</h4>
                  <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
                    Products in this category account for <strong>{selectedCategory.item_count}</strong> active items in your store.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center card-premium">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-slate-500 font-bold">Select a category to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {modalMode === 'add' ? 'New Category' : 'Edit Category'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                    <input 
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {submitting ? 'Processing...' : modalMode === 'add' ? 'Create Category' : 'Update Category'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default CategoriesPage;
