"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Layers, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  MoreVertical,
  GripVertical
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';

const categories = [
  { id: 1, name: 'Fruit Juices', count: 42, image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200' },
  { id: 2, name: 'Milkshakes', count: 28, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200' },
  { id: 3, name: 'Smoothies', count: 15, image: 'https://images.unsplash.com/photo-1546173159-315724a93c90?w=200' },
  { id: 4, name: 'Fresh Fruits', count: 56, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=200' },
];

const subcategories = [
  { id: 1, parentId: 1, name: 'Mango Juice', items: 12 },
  { id: 2, parentId: 1, name: 'Apple Juice', items: 8 },
  { id: 3, parentId: 1, name: 'Orange Juice', items: 15 },
  { id: 4, parentId: 2, name: 'Chocolate Shake', items: 10 },
  { id: 5, parentId: 2, name: 'Vanilla Shake', items: 9 },
];

const CategoriesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Category Management</h1>
          <p className="text-slate-500">Organize your products into logical groups and sub-groups</p>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
          <Plus size={20} />
          Create Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Categories List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Primary Categories</h3>
            <span className="text-xs font-bold text-primary px-2 py-0.5 bg-accent/50 rounded-full">{categories.length} total</span>
          </div>
          
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              whileHover={{ x: 5 }}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "p-4 rounded-3xl cursor-pointer transition-all border-2",
                selectedCategory.id === cat.id
                  ? "bg-white dark:bg-slate-900 border-primary shadow-lg shadow-primary/5"
                  : "bg-white/50 dark:bg-slate-900/50 border-transparent hover:bg-white"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                    <img src={cat.image} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className={cn(
                      "font-bold transition-colors",
                      selectedCategory.id === cat.id ? "text-primary" : "text-slate-800 dark:text-slate-200"
                    )}>
                      {cat.name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">{cat.count} Products</p>
                  </div>
                </div>
                <ChevronRight size={20} className={cn(
                  "transition-colors",
                  selectedCategory.id === cat.id ? "text-primary" : "text-slate-300"
                )} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subcategories Detail View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-primary/20">
                  <img src={selectedCategory.image} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedCategory.name}</h2>
                  <p className="text-slate-500 font-medium">Manage subcategories and filtering tags</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-colors">
                  <ImageIcon size={20} />
                </button>
                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-colors">
                  <Edit size={20} />
                </button>
                <button className="p-3 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-100 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Subcategories</h3>
              <button className="flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                <Plus size={16} />
                Add Subcategory
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subcategories
                .filter(sub => sub.parentId === selectedCategory.id)
                .map((sub) => (
                  <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</p>
                        <p className="text-xs text-slate-500">{sub.items} Items linked</p>
                      </div>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                ))}
              
              <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:border-primary/50 hover:text-primary transition-all cursor-pointer">
                <Plus size={20} className="mr-2" />
                <span className="font-bold text-sm">Add Quick Subcategory</span>
              </div>
            </div>
          </div>

          <div className="card-premium p-8">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6">Category Filtering Tags</h3>
            <div className="flex flex-wrap gap-3">
              {['Sugar Free', '100% Organic', 'Cold Pressed', 'Best Seller', 'New Arrival'].map(tag => (
                <div key={tag} className="px-4 py-2 bg-accent/50 text-primary font-bold text-xs rounded-xl flex items-center gap-2 group">
                  {tag}
                  <button className="text-primary/50 hover:text-primary">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button className="px-4 py-2 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                <Plus size={14} />
                Add Tag
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CategoriesPage;
