"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Bike, 
  Car, 
  Phone, 
  Activity, 
  Trash2, 
  Edit2, 
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Plus,
  Truck
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    phone: '',
    vehicle_type: 'bike',
    vehicle_number: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addPartner = async () => {
    if (!newPartner.name || !newPartner.phone) return;
    try {
      const { error } = await supabase
        .from('delivery_partners')
        .insert([newPartner]);

      if (error) throw error;
      toast({ title: "Partner Added", variant: "success" });
      setIsAdding(false);
      setNewPartner({ name: '', phone: '', vehicle_type: 'bike', vehicle_number: '' });
      fetchPartners();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'busy' : currentStatus === 'busy' ? 'offline' : 'available';
    try {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ availability_status: nextStatus })
        .eq('id', id);
      if (error) throw error;
      fetchPartners();
    } catch (err) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Partners</h1>
            <p className="text-slate-500 font-medium font-outfit">Manage your delivery fleet and availability</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <UserPlus size={18} /> Add Partner
          </button>
        </div>

        {/* Add Partner Modal/Drawer (Simplified for this version) */}
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-premium p-8 bg-white dark:bg-slate-900 border-2 border-primary/20 shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                placeholder="Partner Name" 
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold"
                value={newPartner.name}
                onChange={e => setNewPartner({...newPartner, name: e.target.value})}
              />
              <input 
                placeholder="Phone Number" 
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold"
                value={newPartner.phone}
                onChange={e => setNewPartner({...newPartner, phone: e.target.value})}
              />
              <select 
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold"
                value={newPartner.vehicle_type}
                onChange={e => setNewPartner({...newPartner, vehicle_type: e.target.value})}
              >
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
              </select>
              <div className="flex gap-2">
                <button onClick={addPartner} className="flex-1 bg-primary text-white rounded-xl font-black text-xs">Save Partner</button>
                <button onClick={() => setIsAdding(false)} className="px-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-xs">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)
          ) : partners.map(partner => (
            <motion.div 
              key={partner.id}
              whileHover={{ y: -4 }}
              className="card-premium p-6 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-2xl flex items-center justify-center text-primary relative">
                  <Bike size={32} />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900",
                    partner.availability_status === 'available' ? "bg-emerald-500" : partner.availability_status === 'busy' ? "bg-amber-500" : "bg-slate-300"
                  )} />
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2",
                    partner.availability_status === 'available' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {partner.availability_status}
                  </span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">₹{partner.total_earnings || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Earnings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{partner.name}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                    <Phone size={12} /> {partner.phone}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Vehicle</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 capitalize">{partner.vehicle_type}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Active Orders</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{partner.current_orders || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(partner.id, partner.availability_status)}
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    Change Status
                  </button>
                  <button className="px-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Truck size={120} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
