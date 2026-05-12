"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Clock, 
  RefreshCcw,
  Phone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Truck,
  Package,
  XCircle
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';
import Skeleton from '@/components/ui/Skeleton';
import { useAppStore } from '@/store/useStore';

const orderStatuses = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING', color: 'bg-amber-500' },
  { label: 'Confirmed', value: 'CONFIRMED', color: 'bg-blue-500' },
  { label: 'Preparing', value: 'PREPARING', color: 'bg-purple-500' },
  { label: 'Packed', value: 'PACKED', color: 'bg-orange-500' },
  { label: 'Delivery', value: 'OUT_FOR_DELIVERY', color: 'bg-indigo-500' },
  { label: 'Delivered', value: 'DELIVERED', color: 'bg-emerald-500' },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [displayLimit, setDisplayLimit] = useState(10);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'orders', callback: () => fetchOrders(true) }
  ]);

  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`*`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Manually fetch profiles since FK is missing
      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map(o => o.user_id).filter(Boolean)));
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);
        
        const profileMap = (profileData || []).reduce((acc: any, p) => {
          acc[p.id] = p;
          return acc;
        }, {});

        const ordersWithProfiles = data.map(o => ({
          ...o,
          profiles: profileMap[o.user_id]
        }));
        setOrders(ordersWithProfiles);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, currentStatus: string) => {
    const statusUpper = currentStatus.toUpperCase();
    const nextStatusMap: any = {
      'PENDING': 'CONFIRMED',
      'RECEIVED': 'CONFIRMED',
      'CONFIRMED': 'PREPARING',
      'PREPARING': 'PACKED',
      'PACKED': 'OUT_FOR_DELIVERY',
      'OUT_FOR_DELIVERY': 'DELIVERED',
      'received': 'CONFIRMED'
    };

    const nextStatus = nextStatusMap[statusUpper] || nextStatusMap[currentStatus];
    if (!nextStatus) return;

    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast({
        title: "Order Updated",
        description: `Order status changed to ${nextStatus.toUpperCase()}`,
        variant: "success",
      });
      fetchOrders(true);
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchLower) || 
      order.profiles?.full_name?.toLowerCase().includes(searchLower);
    return matchesTab && matchesSearch;
  });

  const displayedOrders = filteredOrders.slice(0, displayLimit);

  const OrderCardMobile = ({ order }: { order: any }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5 mb-4 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-full mb-1 inline-block">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <h4 className="text-base font-black text-slate-900 dark:text-white truncate max-w-[150px]">
            {order.profiles?.full_name || 'Guest Customer'}
          </h4>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <Clock size={12} />
            {format(new Date(order.created_at), 'h:mm a • MMM d')}
          </p>
        </div>
        <div className={cn(
          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
          order.status?.toUpperCase() === 'DELIVERED' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        )}>
          {order.status}
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Amount</p>
          <p className="text-lg font-black text-slate-900 dark:text-white">₹{order.total_amount}</p>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 mt-1",
            order.payment_status === 'paid' ? "text-emerald-500" : "text-amber-500"
          )}>
            <CreditCard size={10} /> {order.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
          </p>
        </div>
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
          <Package size={24} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
          <Eye size={14} /> Details
        </button>
        {order.status !== 'delivered' && (
          <button 
            onClick={() => updateOrderStatus(order.id, order.status)}
            disabled={updatingId === order.id}
            className="flex-[2] py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {updatingId === order.id ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
            Next Status
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <AdminLayout>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Orders</h1>
          <p className="text-xs lg:text-sm text-slate-500 font-medium">Real-time delivery management</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => fetchOrders()}
            className="flex-1 md:flex-none p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 flex items-center justify-center gap-2 font-bold text-xs"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button className="flex-1 md:flex-none p-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

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

      <div className="card-premium p-3 mb-6 flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search Order ID, Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-medium focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
          />
        </div>
        <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
          <Filter size={18} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="card-premium p-4 flex items-center gap-4">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card-premium p-6 space-y-4">
                <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-16 rounded-xl" /></div>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-2 pt-4"><Skeleton className="h-10 flex-1 rounded-xl" /><Skeleton className="h-10 flex-[2] rounded-xl" /></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block card-premium overflow-hidden">
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
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/30 transition-all will-change-transform">
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-800 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {format(new Date(order.created_at), 'h:mm a')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-white">{order.profiles?.full_name || 'Guest'}</p>
                      <p className="text-xs text-slate-500">{order.profiles?.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 dark:text-white">₹{order.total_amount}</p>
                      <p className={cn(
                        "text-[10px] font-black tracking-tight uppercase",
                        order.payment_status === 'paid' ? "text-emerald-500" : "text-amber-500"
                      )}>{order.payment_status}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider",
                        order.status?.toUpperCase() === 'DELIVERED' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => updateOrderStatus(order.id, order.status)}
                        disabled={updatingId === order.id || order.status?.toUpperCase() === 'DELIVERED'}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all disabled:opacity-50"
                      >
                        {updatingId === order.id ? 'Updating...' : order.status?.toUpperCase() === 'DELIVERED' ? 'Done' : 'Next Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {displayedOrders.length > 0 ? (
              displayedOrders.map(order => <OrderCardMobile key={order.id} order={order} />)
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500 font-bold">No orders found.</p>
              </div>
            )}

            {displayLimit < filteredOrders.length && (
              <div className="flex justify-center mt-6">
                <button 
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                  className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                >
                  Load More Orders
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default OrdersPage;
