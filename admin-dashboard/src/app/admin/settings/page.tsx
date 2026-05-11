"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Store, 
  Bell, 
  Shield, 
  Key, 
  Smartphone,
  Cloud,
  Save,
  Camera,
  IndianRupee,
  ExternalLink
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'store', label: 'Store Details', icon: Store },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Platform Settings</h1>
          <p className="text-slate-500">Configure your platform preferences and security controls</p>
        </div>
        
        <button className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all">
          <Save size={20} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-primary shadow-lg shadow-primary/5 border-l-4 border-primary"
                  : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-900/50 hover:text-slate-800"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="card-premium p-10">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary/20">
                      A
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-primary hover:scale-110 transition-transform">
                      <Camera size={18} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Photo</h3>
                    <p className="text-sm text-slate-500 mb-4">Upload a professional photo for your admin account</p>
                    <div className="flex gap-2">
                      <button className="text-xs font-bold text-primary hover:underline">Change Image</button>
                      <button className="text-xs font-bold text-rose-500 hover:underline">Remove</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                    <input type="text" defaultValue="Admin User" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                    <input type="email" defaultValue="admin@juicyapp.com" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <input type="text" defaultValue="+91 98765 43210" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Role</label>
                    <div className="px-5 py-4 bg-accent/50 text-primary font-bold rounded-2xl">Super Admin</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'api' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Payment Gateways</h3>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                        <IndianRupee className="text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">Razorpay</p>
                        <p className="text-xs text-slate-500 font-medium">Standard Checkout Integration</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest">Active</button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Razorpay Key ID</label>
                      <input type="password" value="rzp_test_Sn7EB9DtuuYSVJ" className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Razorpay Key Secret</label>
                      <input type="password" value="••••••••••••••••••••••••" className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Cloud Infrastructure</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl">
                          <Cloud size={24} className="text-blue-500" />
                        </div>
                        <ExternalLink size={16} className="text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white">Cloudinary</p>
                      <p className="text-xs text-slate-500 mb-4">Image Optimization & Storage</p>
                      <button className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:text-primary transition-all">Configured</button>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl">
                          <Smartphone size={24} className="text-emerald-500" />
                        </div>
                        <ExternalLink size={16} className="text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white">Twilio WhatsApp</p>
                      <p className="text-xs text-slate-500 mb-4">Customer Notification Engine</p>
                      <button className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:text-primary transition-all">Configured</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
