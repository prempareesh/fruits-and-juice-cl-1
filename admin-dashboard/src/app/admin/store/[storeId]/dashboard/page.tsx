"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  RefreshCcw,
  Download,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import AdminLayout from '@/components/layout/AdminLayout';
import { cn } from '@/lib/utils';

const salesData = [
  { name: 'Mon', sales: 4000, orders: 24 },
  { name: 'Tue', sales: 3000, orders: 18 },
  { name: 'Wed', sales: 5000, orders: 32 },
  { name: 'Thu', sales: 2780, orders: 15 },
  { name: 'Fri', sales: 1890, orders: 12 },
  { name: 'Sat', sales: 6390, orders: 45 },
  { name: 'Sun', sales: 7490, orders: 52 },
];

const topProducts = [
  { name: 'Mango Magic', sales: 120, image: 'https://images.unsplash.com/photo-1546173159-315724a93c90?w=100' },
  { name: 'Apple Fresh', sales: 95, image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=100' },
  { name: 'Pure Orange', sales: 88, image: 'https://images.unsplash.com/photo-1613478223719-2ab30262b124?w=100' },
  { name: 'Green Detox', sales: 76, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=100' },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="card-premium p-6 flex flex-col gap-4"
  >
    <div className="flex justify-between items-start">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-bold",
          trend === 'up' ? "text-emerald-500" : "text-rose-500"
        )}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-500 font-medium text-sm mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  return (
    <AdminLayout>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Store Analytics</h1>
          <p className="text-slate-500">Real-time performance overview for Juicy App Nellore</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Calendar size={18} />
            <span>Last 7 Days</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Revenue" 
          value="₹1,24,500" 
          icon={IndianRupee} 
          trend="up" 
          trendValue="+12.5%" 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Orders" 
          value="1,240" 
          icon={ShoppingCart} 
          trend="up" 
          trendValue="+8.2%" 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Active Customers" 
          value="850" 
          icon={Users} 
          trend="down" 
          trendValue="-2.4%" 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Stock Items" 
          value="452" 
          icon={Package} 
          color="bg-orange-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 card-premium p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-sm text-slate-500">Daily sales performance for current week</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-xs font-bold text-primary">Revenue</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#84cc16" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-premium p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Products</h3>
          <div className="space-y-6">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-slate-500">Fresh Juice Category</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{product.sales}</p>
                  <p className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">Sales</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-600 font-bold rounded-2xl hover:bg-primary hover:text-white transition-all">
            View All Products
          </button>
        </div>
      </div>

      {/* Order Status & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-premium p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h3>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <RefreshCcw size={18} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 pr-4">Order ID</th>
                  <th className="pb-4 pr-4">Customer</th>
                  <th className="pb-4 pr-4">Status</th>
                  <th className="pb-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300">#ORD-00{item}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-800 dark:text-white">Customer {item}</p>
                      <p className="text-xs text-slate-500">2 mins ago</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Pending
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 dark:text-white">₹450.00</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-premium p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Order Status Distribution</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-500" size={20} />
                  <span className="font-bold text-blue-700">Pending</span>
                </div>
                <span className="text-xl font-black text-blue-700">12</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <span className="font-bold text-emerald-700">Delivered</span>
                </div>
                <span className="text-xl font-black text-emerald-700">45</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="text-rose-500" size={20} />
                  <span className="font-bold text-rose-700">Cancelled</span>
                </div>
                <span className="text-xl font-black text-rose-700">3</span>
              </div>
            </div>
            
            <div className="h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: 12 },
                      { name: 'Delivered', value: 45 },
                      { name: 'Cancelled', value: 3 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
