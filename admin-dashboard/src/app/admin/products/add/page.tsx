"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Info,
  DollarSign,
  Package,
  Layers,
  Image as ImageIcon,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';

const AddProductPage = () => {
  const router = useRouter();
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');

  const calculateDiscount = () => {
    if (!sellingPrice || !mrp) return 0;
    const s = parseFloat(sellingPrice);
    const m = parseFloat(mrp);
    if (m <= s) return 0;
    return Math.round(((m - s) / m) * 100);
  };

  const discount = calculateDiscount();

  return (
    <AdminLayout>
      {/* Mobile Top Header */}
      <div className="flex items-center gap-4 mb-6 lg:mb-8">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">New Product</h1>
          <p className="text-[10px] lg:text-sm text-slate-500 font-bold uppercase tracking-widest">Adding to Inventory</p>
        </div>
      </div>

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
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fresh Alphanso Mango Juice"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm lg:text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Description</label>
                <textarea 
                  placeholder="Tell customers about the taste and freshness..."
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm appearance-none">
                    <option>Fruit Juices</option>
                    <option>Milkshakes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subcategory</label>
                  <input type="text" placeholder="Cold Pressed" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm" />
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
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Pricing & Stock</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">MRP (₹)</label>
                <input 
                  type="number" 
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-black text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Selling (₹)</label>
                <input 
                  type="number" 
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-black text-sm text-primary"
                />
              </div>
              <div className="col-span-2 lg:col-span-1 space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Discount (%)</label>
                <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-black rounded-2xl flex items-center justify-center text-sm">
                  {discount}% OFF Applied
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                <input type="number" placeholder="100" className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-black text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                <select className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-sm">
                  <option>ml</option>
                  <option>litres</option>
                  <option>kg</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-6 lg:space-y-8">
          <div className="card-premium p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <ImageIcon size={18} className="text-blue-500" />
              Product Image
            </h3>
            <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] flex flex-col items-center justify-center p-6 text-center group hover:border-primary/50 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <Upload size={24} className="text-primary" />
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Upload Media</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">Max 2MB per file</p>
            </div>
          </div>

          <div className="card-premium p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Layers size={18} className="text-purple-500" />
              Organization
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags</label>
                <input type="text" placeholder="Fresh, Organic..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none text-sm font-bold" />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Status</span>
                <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-30 flex gap-3 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        <button className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-sm text-slate-600 dark:text-slate-300">
          Draft
        </button>
        <button className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/25 flex items-center justify-center gap-2">
          <Save size={18} />
          Publish Now
        </button>
      </div>
      
      {/* DESKTOP FLOATING BAR (Hidden on Mobile) */}
      <div className="hidden lg:flex fixed bottom-10 right-10 flex-col gap-3 z-30 animate-in slide-in-from-right-10 duration-500">
        <button className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-primary transition-all">
          <Save size={24} />
        </button>
        <button className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-all">
          <Plus size={24} />
        </button>
      </div>
    </AdminLayout>
  );
};

export default AddProductPage;
