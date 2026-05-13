"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
  MapPin,
  Mail,
  PhoneCall
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useStore';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { currentStore, user } = useAppStore();
  const [profile, setProfile] = useState({
    full_name: user?.name || '',
    phone: '',
    email: user?.email || 'admin@juicyapp.com'
  });

  // Store Settings State
  const [storeSettings, setStoreSettings] = useState({
    id: '',
    min_order_value: '0',
    delivery_fee: '0',
    free_delivery_threshold: '0',
    shop_address: '',
    contact_phone: '',
    contact_email: '',
    opening_time: '09:00',
    closing_time: '21:00',
    is_delivery_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Profile for additional details like phone
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setProfile({
            full_name: profileData.full_name || user.name || '',
            phone: profileData.phone || '',
            email: user.email || 'admin@juicyapp.com'
          });
        }
      }

      // Fetch Store Settings
      const { data: settingsData } = await supabase.from('store_settings').select('*').limit(1).single();
      if (settingsData) {
        setStoreSettings({
          id: settingsData.id,
          min_order_value: settingsData.min_order_value.toString(),
          delivery_fee: settingsData.delivery_fee.toString(),
          free_delivery_threshold: (settingsData.free_delivery_threshold || 0).toString(),
          shop_address: settingsData.shop_address || '',
          contact_phone: settingsData.contact_phone || '',
          contact_email: settingsData.contact_email || '',
          opening_time: settingsData.opening_time || '09:00',
          closing_time: settingsData.closing_time || '21:00',
          is_delivery_active: settingsData.is_delivery_active
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (activeTab === 'profile') {
        if (user?.id) {
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: profile.full_name,
              phone: profile.phone
            })
            .eq('id', user.id);
          if (error) throw error;
        }
      } else if (activeTab === 'store') {
        if (!storeSettings.id) {
          throw new Error("Store ID missing. Please refresh.");
        }

        const minOrder = parseFloat(storeSettings.min_order_value) || 0;
        const deliveryFee = parseFloat(storeSettings.delivery_fee) || 0;
        const freeThreshold = parseFloat(storeSettings.free_delivery_threshold) || 0;

        const { error } = await supabase
          .from('store_settings')
          .update({
            min_order_value: minOrder,
            delivery_fee: deliveryFee,
            free_delivery_threshold: freeThreshold,
            shop_address: storeSettings.shop_address,
            contact_phone: storeSettings.contact_phone,
            contact_email: storeSettings.contact_email,
            opening_time: storeSettings.opening_time,
            closing_time: storeSettings.closing_time,
            is_delivery_active: storeSettings.is_delivery_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', storeSettings.id);
        if (error) throw error;
      }
      
      setToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save settings', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'store', label: 'Store Details', icon: Store },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Platform Settings</h1>
          <p className="text-slate-500">Configure your platform preferences and security controls</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={submitting}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm",
              toast.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

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
                    <input 
                      type="text" 
                      value={profile.full_name} 
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      readOnly
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl opacity-60 cursor-not-allowed font-medium outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <input 
                      type="text" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Role</label>
                    <div className="px-5 py-4 bg-accent/50 text-primary font-bold rounded-2xl">Super Admin</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'store' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Delivery Settings */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <IndianRupee size={14} /> Delivery Logistics
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Min. Order Value (₹)</label>
                      <input 
                        type="number" 
                        value={storeSettings.min_order_value}
                        onChange={(e) => setStoreSettings({...storeSettings, min_order_value: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium" 
                />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Standard Delivery Fee (₹)</label>
                      <input 
                        type="number" 
                        value={storeSettings.delivery_fee}
                        onChange={(e) => setStoreSettings({...storeSettings, delivery_fee: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-primary" 
                />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Free Delivery Threshold (₹)</label>
                      <input 
                        type="number" 
                        value={storeSettings.free_delivery_threshold}
                        onChange={(e) => setStoreSettings({...storeSettings, free_delivery_threshold: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-emerald-500" 
                />
                    </div>
                  </div>

                  {/* Operational Settings */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ClockIcon size={14} /> Shop Operations
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Opening</label>
                        <input 
                          type="time" 
                          value={storeSettings.opening_time}
                          onChange={(e) => setStoreSettings({...storeSettings, opening_time: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium" 
                  />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Closing</label>
                        <input 
                          type="time" 
                          value={storeSettings.closing_time}
                          onChange={(e) => setStoreSettings({...storeSettings, closing_time: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium" 
                  />
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Delivery Service</p>
                        <p className="text-[10px] text-slate-500 font-medium">Toggle global delivery availability</p>
                      </div>
                      <button 
                        onClick={() => setStoreSettings({...storeSettings, is_delivery_active: !storeSettings.is_delivery_active})}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 relative transition-all cursor-pointer",
                          storeSettings.is_delivery_active ? "bg-primary" : "bg-slate-300"
                        )}
                      >
                        <motion.div 
                          animate={{ x: storeSettings.is_delivery_active ? 24 : 0 }}
                          className="w-4 h-4 bg-white rounded-full" 
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Contact & Address
                  </h4>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Physical Store Address</label>
                    <textarea 
                      value={storeSettings.shop_address}
                      onChange={(e) => setStoreSettings({...storeSettings, shop_address: e.target.value})}
                      rows={2}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm resize-none" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Support Phone</label>
                      <div className="relative">
                        <PhoneCall size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={storeSettings.contact_phone}
                          onChange={(e) => setStoreSettings({...storeSettings, contact_phone: e.target.value})}
                          placeholder="+91..."
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Support Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="email" 
                          value={storeSettings.contact_email}
                          onChange={(e) => setStoreSettings({...storeSettings, contact_email: e.target.value})}
                          placeholder="help@juicyapp.com"
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
                        />
                      </div>
                    </div>
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
                      <input type="password" defaultValue="rzp_test_Sn7EB9DtuuYSVJ" className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Razorpay Key Secret</label>
                      <input type="password" defaultValue="••••••••••••••••••••••••" className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-sm" />
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
