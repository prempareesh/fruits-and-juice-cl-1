"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  User, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Zap,
  Navigation,
  Phone,
  Bike
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';
import Skeleton from '@/components/ui/Skeleton';

const deliveryStatuses = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending', color: 'bg-amber-500' },
  { label: 'Preparing', value: 'preparing', color: 'bg-purple-500' },
  { label: 'Out for Delivery', value: 'out_for_delivery', color: 'bg-indigo-500' },
  { label: 'Delivered', value: 'delivered', color: 'bg-emerald-500' },
];

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      
      // Fetch Orders with Delivery Details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_partner:delivery_partner_id (id, name, phone, vehicle_type)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch Active Partners
      const { data: partnersData } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('is_active', true);

      // Fetch Profiles for Orders
      const userIds = Array.from(new Set(ordersData.map(o => o.user_id).filter(Boolean)));
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);
      
      const profileMap = (profileData || []).reduce((acc: any, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const enrichedOrders = ordersData.map(o => ({
        ...o,
        customer: profileMap[o.user_id]
      }));

      setOrders(enrichedOrders);
      setPartners(partnersData || []);
    } catch (err) {
      console.error('Error fetching delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  useRealtime([
    { table: 'orders', callback: fetchDeliveryData },
    { table: 'delivery_partners', callback: fetchDeliveryData }
  ]);

  const assignPartner = async (orderId: string, partnerId: string) => {
    setAssigningId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_partner_id: partnerId,
          delivery_status: 'preparing' // Auto-update status when assigned
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Partner Assigned",
        description: "Delivery partner has been assigned successfully.",
        variant: "success",
      });
      fetchDeliveryData();
    } catch (err) {
      toast({
        title: "Assignment Failed",
        description: "Could not assign partner. Try again.",
        variant: "destructive",
      });
    } finally {
      setAssigningId(null);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: status })
        .eq('id', orderId);

      if (error) throw error;
      toast({ title: "Status Updated", description: `Order is now ${status.replace('_', ' ')}` });
      fetchDeliveryData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.delivery_status === activeTab;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="p-2 bg-primary/10 rounded-lg">
                 <Truck size={20} className="text-primary" />
               </div>
               <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Operations</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Command Center</h1>
            <p className="text-slate-500 font-medium">Real-time logistics and fleet management</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {partners.slice(0, 4).map((p, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {p.profile_image ? (
                    <img src={p.profile_image} className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-slate-400" />
                  )}
                </div>
              ))}
              {partners.length > 4 && (
                <div className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-primary text-white flex items-center justify-center text-xs font-black">
                  +{partners.length - 4}
                </div>
              )}
            </div>
            <button className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm hover:shadow-lg transition-all">
              Manage Fleet
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Deliveries', value: orders.filter(o => o.delivery_status !== 'delivered').length, icon: Navigation, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Fleet Online', value: partners.filter(p => p.availability_status === 'available').length, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Avg Time', value: '18 min', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Successful Today', value: orders.filter(o => o.delivery_status === 'delivered').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -4 }}
              className="card-premium p-6 flex items-center gap-5"
            >
              <div className={cn("p-4 rounded-2xl", stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Table Section */}
        <div className="card-premium overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {deliveryStatuses.map(s => (
                <button
                  key={s.value}
                  onClick={() => setActiveTab(s.value)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all",
                    activeTab === s.value ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Find orders or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold outline-none ring-primary/10 focus:ring-4 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5">Order Details</th>
                  <th className="px-8 py-5">Customer / Address</th>
                  <th className="px-8 py-5">Logistics</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i}>
                      <td className="px-8 py-6"><Skeleton className="h-10 w-32" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-10 w-32" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-8 w-24 rounded-full" /></td>
                      <td className="px-8 py-6 text-right"><Skeleton className="h-10 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(order.created_at), 'h:mm a')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col max-w-[250px]">
                        <span className="font-bold text-slate-900 dark:text-white">{order.customer?.full_name || 'Guest User'}</span>
                        <span className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-primary" /> {order.formatted_address || 'No address provided'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {order.delivery_partner ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500">
                            <Bike size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{order.delivery_partner.name}</span>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase">Assigned</span>
                          </div>
                        </div>
                      ) : (
                        <select 
                          onChange={(e) => assignPartner(order.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign Partner</option>
                          {partners.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.vehicle_type})</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        order.delivery_status === 'delivered' ? "bg-emerald-100 text-emerald-600" :
                        order.delivery_status === 'out_for_delivery' ? "bg-indigo-100 text-indigo-600" :
                        "bg-amber-100 text-amber-600"
                      )}>
                        {order.delivery_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              const nextMap: any = { 'pending': 'preparing', 'preparing': 'out_for_delivery', 'out_for_delivery': 'delivered' };
                              const next = nextMap[order.delivery_status];
                              if (next) updateDeliveryStatus(order.id, next);
                            }}
                            className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            <Zap size={18} />
                          </button>
                          <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-slate-900 dark:hover:text-white transition-all">
                            <MoreVertical size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
