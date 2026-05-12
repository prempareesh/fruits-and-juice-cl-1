"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Info,
  DollarSign,
  Package,
  Layers,
  Image as ImageIcon,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useStore';

const AddProductPage = () => {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('fruit');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [unit, setUnit] = useState('ml');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const { currentStore } = useAppStore();
  const { toast } = useToast();
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const calculateDiscount = () => {
    if (!sellingPrice || !mrp) return 0;
    const s = parseFloat(sellingPrice);
    const m = parseFloat(mrp);
    if (m <= s) return 0;
    return Math.round(((m - s) / m) * 100);
  };

  const discount = calculateDiscount();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Maximum image size is 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({ title: "Image Uploaded", description: "Product image updated successfully.", variant: "success" });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: "Upload Failed", description: err.message || "Failed to upload image.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!name || !sellingPrice || !mrp) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, MRP, Selling Price)",
        variant: "destructive",
      });
      return;
    }

    const sPrice = parseFloat(sellingPrice);
    const mPrice = parseFloat(mrp);
    const sStock = parseFloat(stock);

    if (isNaN(sPrice) || sPrice <= 0) {
      toast({ title: "Validation Error", description: "Selling Price must be a positive number", variant: "destructive" });
      return;
    }
    if (isNaN(mPrice) || mPrice <= 0) {
      toast({ title: "Validation Error", description: "MRP must be a positive number", variant: "destructive" });
      return;
    }
    if (isNaN(sStock) || sStock < 0) {
      toast({ title: "Validation Error", description: "Stock amount cannot be negative", variant: "destructive" });
      return;
    }
    if (sPrice > mPrice) {
      toast({ title: "Validation Error", description: "Selling Price cannot be greater than MRP", variant: "destructive" });
      return;
    }

    if (!currentStore?.id) {
      toast({
        title: "Configuration Error",
        description: "No active store selected. Please go to Select Store page.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('products')
        .insert([{
          name,
          description,
          category,
          price_per_kg: parseFloat(sellingPrice),
          stock_kg: parseFloat(stock),
          image_url: imageUrl,
          is_available: isActive,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
      toast({
        title: "Product Published",
        description: `${name} is now live in your store!`,
        variant: "success",
      });
      
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);

    } catch (err: any) {
      console.error('Error publishing product:', err);
      toast({
        title: "Publish Failed",
        description: err.message || "Something went wrong while saving the product.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 shadow-sm hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">New Product</h1>
            <p className="text-[10px] lg:text-sm text-slate-500 font-bold uppercase tracking-widest">Store Inventory</p>
          </div>
        </div>

        {/* Desktop Save Button */}
        <button 
          onClick={handlePublish}
          disabled={loading || success}
          className="hidden lg:flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : success ? <CheckCircle2 size={20} /> : <Save size={20} />}
          {loading ? 'Publishing...' : success ? 'Published!' : 'Publish Product'}
        </button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pb-32 lg:pb-0">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Main Info Section */}
          <div className="card-premium p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Info size={18} />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Basic Details</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Title*</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fresh Alphanso Mango Juice"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm lg:text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about the taste and freshness..."
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm"
                  >
                    <option value="fruit">Fresh Fruits</option>
                    <option value="juice">Fruit Juices</option>
                    <option value="fruit">Milkshakes</option>
                    <option value="juice">Smoothies</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Stock Amount</label>
                  <input 
                    type="number" 
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100" 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm" 
            />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="card-premium p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                <DollarSign size={18} />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Pricing Strategy</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">MRP (₹)*</label>
                <input 
                  type="number" 
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none font-medium text-sm"
          />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price (₹)*</label>
                <input 
                  type="number" 
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none font-medium text-sm text-primary"
          />
              </div>
              <div className="col-span-2 lg:col-span-1 space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Live Discount</label>
                <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-black rounded-2xl flex items-center justify-center text-sm">
                  {discount}% OFF
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-6 lg:space-y-8">
          <div className="card-premium p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <ImageIcon size={18} className="text-blue-500" />
              Display Image
            </h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center group hover:border-primary/50 transition-all cursor-pointer relative"
            >
              {isUploading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              )}
              {imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <Upload size={24} className="text-primary" />
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Upload Media</p>
                </>
              )}
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <input 
              type="text" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste Image URL"
              className="w-full mt-4 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none text-[10px] font-bold"
            />
          </div>

          <div className="card-premium p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Layers size={18} className="text-purple-500" />
              Status
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Available for Sale</span>
                <button 
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    "w-12 h-6 rounded-full relative p-1 transition-all",
                    isActive ? "bg-primary" : "bg-slate-300"
                  )}
                >
                  <motion.div 
                    animate={{ x: isActive ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full" 
                  />
                </button>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase leading-relaxed">
                  Visible to all customers instantly after publishing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-30 flex gap-3 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        <button 
          onClick={handlePublish}
          disabled={loading || success}
          className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {loading ? 'Publishing...' : success ? 'Success!' : 'Publish Now'}
        </button>
      </div>
    </AdminLayout>
  );
};

export default AddProductPage;
