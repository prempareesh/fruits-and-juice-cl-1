"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Users,
  ShoppingCart, 
  IndianRupee,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserX,
  MessageSquare
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';

const customers = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43210', orders: 12, spent: 4500, joined: '12 Jan 2026', status: 'active' },
  { id: 2, name: 'Priya Verma', email: 'priya@example.com', phone: '+91 87654 32109', orders: 8, spent: 3200, joined: '05 Feb 2026', status: 'active' },
  { id: 3, name: 'Amit Kumar', email: 'amit@example.com', phone: '+91 76543 21098', orders: 2, spent: 450, joined: '20 Mar 2026', status: 'inactive' },
  { id: 4, name: 'Sneha Reddy', email: 'sneha@example.com', phone: '+91 65432 10987', orders: 25, spent: 12500, joined: '15 Dec 2025', status: 'active' },
  { id: 5, name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 54321 09876', orders: 5, spent: 1800, joined: '10 Apr 2026', status: 'active' },
];

const CustomersPage = () => {
  return (
    <AdminLayout>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Customer Base</h1>
          <p className="text-slate-500">Manage your relationship with your loyal customers</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Mail size={18} />
            <span>Send Email Blast</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <MessageSquare size={18} />
            <span>App Notifications</span>
          </button>
        </div>
      </div>

      {/* CRM Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-premium p-6 flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500">
            <Users size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">Total Registered</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">1,240</h3>
            <p className="text-xs text-emerald-500 font-bold mt-1">+12% this month</p>
          </div>
        </div>
        <div className="card-premium p-6 flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">Active Now</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">85</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">Real-time users</p>
          </div>
        </div>
        <div className="card-premium p-6 flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
            <IndianRupee size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">Avg. Lifetime Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹1,850</h3>
            <p className="text-xs text-emerald-500 font-bold mt-1">+5% vs last year</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card-premium p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 hover:text-primary transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Customers Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Contact Info</th>
                <th className="px-6 py-5">Activity</th>
                <th className="px-6 py-5">Spent</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center text-primary font-black text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          Joined {user.joined}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Mail size={14} className="text-primary/50" />
                        {user.email}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Phone size={14} className="text-primary/50" />
                        {user.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                        <ShoppingCart size={16} />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{user.orders} Orders</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">₹{user.spent.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Lifetime Value</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      user.status === 'active' 
                        ? "bg-emerald-100 text-emerald-600" 
                        : "bg-slate-100 text-slate-400"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-accent/30 rounded-lg transition-all">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                        <UserX size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900 dark:text-white font-bold">1</span> of 24
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-transparent hover:border-slate-200 disabled:opacity-50" disabled>
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-transparent hover:border-slate-200">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomersPage;
