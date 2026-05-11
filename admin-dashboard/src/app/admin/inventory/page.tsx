"use client";

import React from 'react';
import { motion } from 'framer-motion';
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
  PackagePlus,
  Box
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';

const inventoryItems = [
  { id: 1, name: 'Alphanso Mango', category: 'Fruits', stock: 120, unit: 'kg', status: 'sufficient', lastUpdated: '2 hours ago' },
  { id: 2, name: 'Green Apple', category: 'Fruits', stock: 8, unit: 'kg', status: 'low', lastUpdated: '1 hour ago' },
  { id: 3, name: 'Fresh Milk', category: 'Dairy', stock: 45, unit: 'litres', status: 'sufficient', lastUpdated: '30 mins ago' },
  { id: 4, name: 'Cocoa Powder', category: 'Add-ons', stock: 2, unit: 'kg', status: 'critical', lastUpdated: '5 mins ago' },
  { id: 5, name: 'Glass Bottles', category: 'Packaging', stock: 500, unit: 'units', status: 'sufficient', lastUpdated: '1 day ago' },
];

const InventoryPage = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Inventory Control</h1>
          <p className="text-slate-500">Monitor stock levels and manage procurement</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <History size={18} />
            <span>Stock History</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <PackagePlus size={18} />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-premium p-6 border-l-8 border-emerald-500">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Items in Stock</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">452</h3>
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs mt-2">
            <CheckCircle2 size={14} />
            Healthy Levels
          </div>
        </div>
        <div className="card-premium p-6 border-l-8 border-amber-500">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Low Stock Alerts</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">12</h3>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-2">
            <AlertTriangle size={14} />
            Action Required
          </div>
        </div>
        <div className="card-premium p-6 border-l-8 border-rose-500">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Out of Stock</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">4</h3>
          <div className="flex items-center gap-1 text-rose-500 font-bold text-xs mt-2">
            <AlertTriangle size={14} />
            Critical Status
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-premium p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search inventory items..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 hover:text-primary transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Inventory Table */}
      <div className="card-premium overflow-hidden">
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
            {inventoryItems.map((item) => (
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
                  <span className="text-sm font-medium text-slate-500">{item.category}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-black text-lg",
                      item.status === 'critical' ? "text-rose-500" : item.status === 'low' ? "text-amber-500" : "text-slate-900 dark:text-white"
                    )}>
                      {item.stock}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase">{item.unit}</span>
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
                    <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                      <ArrowUp size={18} />
                    </button>
                    <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all">
                      <ArrowDown size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default InventoryPage;
