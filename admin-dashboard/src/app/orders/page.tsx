'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, User, Phone, MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Order } from '@/types';

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(*), order_items(*, products(*))')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setOrders((data as unknown as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    async function initialFetch() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(*), order_items(*, products(*))')
        .order('created_at', { ascending: false });
      
      if (isMounted) {
        if (error) console.error(error);
        else setOrders((data as unknown as Order[]) || []);
        setLoading(false);
      }
    }

    initialFetch();
    
    // Subscribe to new orders
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        fetchOrders(false);
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  async function updateStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    if (!error) fetchOrders();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-500 text-sm">Track and manage customer orders in real-time.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Fetching latest orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
            <p className="text-gray-500">Incoming orders will appear here automatically.</p>
          </div>
        ) : orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-red-200 transition-all">
            <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <ShoppingBag className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${order.payment_type === 'online' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {order.payment_type.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <User size={16} className="text-gray-400" />
                    <span>{order.profiles?.full_name || 'Anonymous User'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Phone size={16} className="text-gray-400" />
                    <span>{order.profiles?.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-gray-700">
                    <MapPin size={16} className="text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{order.formatted_address || order.address || 'Pickup'}</p>
                      {order.landmark && (
                        <p className="text-xs text-gray-500 mt-0.5">Landmark: {order.landmark}</p>
                      )}
                      {order.latitude && order.longitude && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-red-500 font-bold hover:underline mt-2 inline-block flex items-center space-x-1"
                        >
                          <span>📍 View on Google Maps</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</h4>
                <div className="space-y-2">
                  {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}x {item.products?.name || 'Product'}</span>
                      <span className="font-medium text-gray-900">₹{item.subtotal}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</h4>
                <div className="flex flex-col space-y-2">
                  {order.status === 'received' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'processing')}
                      className="w-full bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Clock size={16} />
                      <span>Start Processing</span>
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>Mark as Ready</span>
                    </button>
                  )}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="w-full border border-red-200 text-red-600 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle size={16} />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
