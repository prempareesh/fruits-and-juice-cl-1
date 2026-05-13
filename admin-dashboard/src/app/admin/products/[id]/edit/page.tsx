"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Info,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useStore';

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // UI State
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setFetching(true);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setName(data.name);
        setDescription(data.description || '');
        setCategory(data.category);
        setPrice(data.price_per_kg.toString());
        setStock(data.stock_kg.toString());
        setImageUrl(data.image_url);
        setIsActive(data.is_available);
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product details.');
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'juice-shop-products');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
      }

      setImageUrl(data.secure_url);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setError(err.message || "Failed to upload image to Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name || !price) {
      setError('Please fill in required fields (Name, Price)');
      return;
    }

    const sPrice = parseFloat(price);
    const sStock = parseFloat(stock);

    if (isNaN(sPrice) || sPrice <= 0) {
      setError("Price must be a positive number");
      return;
    }
    if (isNaN(sStock) || sStock < 0) {
      setError("Stock amount cannot be negative");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name,
          description,
          category,
          price_per_kg: parseFloat(price),
          stock_kg: parseFloat(stock),
          image_url: imageUrl,
          is_available: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);

    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Something went wrong while updating the product.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary mb-4" size={32} />
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Loading Product Details...</p>
        </div>
      </AdminLayout>
    );
  }

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
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Edit Product</h1>
            <p className="text-[10px] lg:text-sm text-slate-500 font-bold uppercase tracking-widest">Product ID: {id?.slice(0, 8)}</p>
          </div>
        </div>

        <button 
          onClick={handleUpdate}
          disabled={loading || success}
          className="hidden lg:flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : success ? <CheckCircle2 size={20} /> : <Save size={20} />}
          {loading ? 'Updating...' : success ? 'Updated!' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm flex items-center gap-3"
        >
          <AlertTriangle size={18} />
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pb-32 lg:pb-0">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="card-premium p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Info size={18} />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Product Information</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Title*</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm lg:text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <input 
                    type="text" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Stock Amount (kg)</label>
                  <input 
                    type="number" 
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm" 
            />
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                <DollarSign size={18} />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Pricing</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Price per kg (₹)*</label>
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none font-medium text-lg text-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <div className="card-premium p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <ImageIcon size={18} className="text-blue-500" />
              Image URL
            </h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] overflow-hidden mb-4 relative cursor-pointer"
            >
              {isUploading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              )}
              {imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400">Upload New</p>
                </div>
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
              placeholder="Paste Image URL"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none text-[10px] font-bold"
            />
          </div>

          <div className="card-premium p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Layers size={18} className="text-purple-500" />
              Status
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Available</span>
              <button 
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-12 h-6 rounded-full relative p-1 transition-all cursor-pointer",
                  isActive ? "bg-primary" : "bg-slate-300"
                )}
              >
                <motion.div 
                  animate={{ x: isActive ? 24 : 0 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm" 
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-30 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        <button 
          onClick={handleUpdate}
          disabled={loading || success}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {loading ? 'Updating...' : success ? 'Success!' : 'Update Product'}
        </button>
      </div>
    </AdminLayout>
  );
};

export default EditProductPage;
