"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  MapPin,
  RefreshCcw,
  MoreVertical,
  Calendar,
  CreditCard,
  Package
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';

const orderStatuses = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending', color: 'bg-amber-500' },
  { label: 'Accepted', value: 'accepted', color: 'bg-blue-500' },
  { label: 'Preparing', value: 'preparing', color: 'bg-purple-500' },
  { label: 'Delivery', value: 'out_for_delivery', color: 'bg-orange-500' },
  { label: 'Done', value: 'delivered', color: 'bg-emerald-500' },
];

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('all');

  const OrderCardMobile = ({ order }: any) => (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="card-premium p-5 mb-4 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-full mb-1 inline-block">
            #ORD-902{order}
          </span>
          <h4 className="text-base font-black text-slate-900 dark:text-white">Rahul Sharma</h4>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <Clock size={12} />
            10:45 AM • Today
          </p>
        </div>
        <div className={cn(
          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
          order % 2 === 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        )}>
          {order % 2 === 0 ? "Delivered" : "Preparing"}
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(img => (
            <div key={img} className="w-8 h-8 rounded-lg ring-2 ring-white dark:ring-slate-950 bg-slate-100 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=100" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">3 Items • <span className="text-slate-900 dark:text-white font-black">₹850.00</span></p>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight flex items-center gap-1">
            <CreditCard size={10} /> Paid via Razorpay
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
          <Eye size={14} /> View
        </button>
        <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
          <RefreshCcw size={14} /> Update
        </button>
        <button className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
          <Phone size={16} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <AdminLayout>
      {/* Header Area - Compact on Mobile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Orders</h1>
          <p className="text-xs lg:text-sm text-slate-500 font-medium">Managing live delivery requests</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 flex items-center justify-center gap-2 font-bold text-xs">
            <RefreshCcw size={16} />
            <span>Sync</span>
          </button>
          <button className="flex-1 md:flex-none p-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <Download size={16} />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Tabs / Filters - Scrollable on Mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
        {orderStatuses.map((status) => (
          <button
            key={status.value}
            onClick={() => setActiveTab(status.value)}
            className={cn(
              "px-5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all border-2",
              activeTab === status.value
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-white dark:bg-slate-900 border-transparent text-slate-500 hover:border-slate-200"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Search Bar - Full Width on Mobile */}
      <div className="card-premium p-3 mb-6 flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search Order ID, Name..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
          <Filter size={18} />
        </button>
      </div>

      {/* Desktop View (Hidden on Mobile) */}
      <div className="hidden lg:block card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Order</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="group hover:bg-slate-50/30 transition-all">
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-800 dark:text-white">#ORD-902{i}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">10:45 AM</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 dark:text-white">Rahul Sharma</p>
                    <p className="text-xs text-slate-500">+91 98765 43210</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 dark:text-white">₹850.00</p>
                    <p className="text-[10px] text-emerald-500 font-bold tracking-tight uppercase">Paid</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider",
                      i % 2 === 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {i % 2 === 0 ? "Delivered" : "Preparing"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Hidden on Desktop) */}
      <div className="lg:hidden">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <OrderCardMobile key={i} order={i} />
        ))}
        
        {/* Pagination - Mobile Style */}
        <div className="flex items-center justify-between mt-8 p-2">
          <button className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-black text-slate-900 dark:text-white">Page 1 of 12</span>
          <button className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
