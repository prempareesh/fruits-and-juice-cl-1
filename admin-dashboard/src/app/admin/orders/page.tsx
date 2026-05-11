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
  Package
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const orderStatuses = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending', color: 'bg-amber-500' },
  { label: 'Accepted', value: 'accepted', color: 'bg-blue-500' },
  { label: 'Preparing', value: 'preparing', color: 'bg-purple-500' },
  { label: 'Delivery', value: 'out_for_delivery', color: 'bg-orange-500' },
  { label: 'Done', value: 'delivered', color: 'bg-emerald-500' },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatusMap: any = {
      'pending': 'accepted',
      'accepted': 'preparing',
      'preparing': 'out_for_delivery',
      'out_for_delivery': 'delivered'
    };

    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (err) {
      console.error('Error updating status:', err);
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
          order.status === 'delivered' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        )}>
          {order.status}
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Amount</p>
          <p className="text-lg font-black text-slate-900 dark:text-white">₹{order.total_price}</p>
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
            onClick={fetchOrders}
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
          <Filter size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary mb-4" size={32} />
          <p className="text-slate-500 font-bold">Loading Live Orders...</p>
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
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/30 transition-all">
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
                      <p className="font-black text-slate-900 dark:text-white">₹{order.total_price}</p>
                      <p className={cn(
                        "text-[10px] font-black tracking-tight uppercase",
                        order.payment_status === 'paid' ? "text-emerald-500" : "text-amber-500"
                      )}>{order.payment_status}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider",
                        order.status === 'delivered' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => updateOrderStatus(order.id, order.status)}
                        disabled={updatingId === order.id || order.status === 'delivered'}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all disabled:opacity-50"
                      >
                        {updatingId === order.id ? 'Updating...' : order.status === 'delivered' ? 'Done' : 'Next Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => <OrderCardMobile key={order.id} order={order} />)
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500 font-bold">No orders found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default OrdersPage;
