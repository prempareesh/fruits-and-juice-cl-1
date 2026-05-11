"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  Users,
  ShoppingCart,
  IndianRupee,
  Activity
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

const data = [
  { name: 'Jan', revenue: 45000, orders: 120 },
  { name: 'Feb', revenue: 52000, orders: 150 },
  { name: 'Mar', revenue: 48000, orders: 140 },
  { name: 'Apr', revenue: 61000, orders: 190 },
  { name: 'May', revenue: 55000, orders: 170 },
  { name: 'Jun', revenue: 67000, orders: 210 },
];

const COLORS = ['#84cc16', '#f97316', '#3b82f6', '#8b5cf6'];

const AnalyticsPage = () => {
  return (
    <AdminLayout>
      {/* Header Area - Responsive Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Performance</h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium">Real-time growth insights</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-600 text-sm shadow-sm">
            <Calendar size={18} />
            <span className="hidden sm:inline">Last 30 Days</span>
            <span className="sm:hidden">30D</span>
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20">
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - Mobile First (1 -> 2 -> 4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8 lg:mb-10">
        {[
          { label: 'Revenue', value: '₹3.2L', trend: '+18%', icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Orders', value: '980', trend: '+5%', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Customers', value: '1.2K', trend: '+12%', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Conversion', value: '4.8%', trend: '-2%', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            whileTap={{ scale: 0.98 }}
            className="card-premium p-4 lg:p-6"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={cn("p-2 lg:p-3 rounded-xl lg:rounded-2xl", stat.bg)}>
                <stat.icon className={stat.color} size={18} />
              </div>
              <div className={cn(
                "text-[10px] lg:text-xs font-black px-1.5 py-0.5 rounded-lg",
                stat.trend.startsWith('+') ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Charts - Stacking on mobile */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 mb-8 lg:mb-10">
        <div className="card-premium p-5 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Revenue Growth</h3>
              <p className="text-xs lg:text-sm text-slate-500">Daily performance trends</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-[10px] lg:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Live Tracker</span>
            </div>
          </div>
          
          <div className="h-[250px] lg:h-[350px] w-full -ml-4 lg:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#84cc16" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="card-premium p-6 lg:p-8">
          <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white mb-6">Order Status</h3>
          <div className="h-[200px] lg:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Delivered', value: 65 },
                    { name: 'Pending', value: 25 },
                    { name: 'Cancelled', value: 10 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#84cc16" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {['Delivered', 'Pending', 'Cancelled'].map((status, i) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? '#84cc16' : i === 1 ? '#3b82f6' : '#f43f5e' }} />
                <span className="text-[10px] font-black text-slate-500 uppercase">{status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card-premium p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Top Products</h3>
            <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl group hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden shadow-sm">
                    <img src={`https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=100`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm lg:text-base text-slate-800 dark:text-white group-hover:text-primary transition-colors">Juice Item {i}</p>
                    <p className="text-[10px] lg:text-xs text-slate-400 font-medium">120 Sales • ₹450 Avg</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white text-sm lg:text-base">₹54,000</p>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">+12% Growth</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;
