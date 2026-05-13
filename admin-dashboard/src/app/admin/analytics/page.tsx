"use client";
 
import React, { useState, useEffect } from 'react';
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
  Activity,
  Loader2
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/store/useStore';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

// Dynamic imports for charts to prevent hydration issues
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });

const COLORS = ['#84cc16', '#f97316', '#3b82f6', '#8b5cf6'];

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    avgOrderValue: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'orders', callback: () => fetchAnalyticsData(true) },
    { table: 'profiles', callback: () => fetchAnalyticsData(true) }
  ]);

  const isFetching = React.useRef(false);

  const fetchAnalyticsData = async (isBackground = false) => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      if (!isBackground) setLoading(true);

      // 1. Fetch Orders - Only needed columns
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status, user_id')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      const allOrders = orders as any[];

      // 2. Fetch Customer Count - More efficiently
      const uniqueCustomers = new Set(allOrders?.map(o => o.user_id)).size || 0;

      // 3. Fetch Top Products - Specific columns
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('quantity, subtotal, products(name, image_url)');
      
      if (itemsError) throw itemsError;

      // --- Processing data (Offload slightly if needed, but here we just optimize) ---
      
      // Stats
      let totalRevenue = 0;
      const statusCounts: any = {};
      
      allOrders?.forEach(order => {
        totalRevenue += Number(order.total_amount || 0);
        const status = order.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        revenue: totalRevenue,
        orders: totalOrders,
        customers: uniqueCustomers,
        avgOrderValue
      });

      // Chart Data (Last 6 months)
      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
      });

      const monthlyData = last6Months.map(month => {
        const monthKey = format(month, 'MMM yyyy');
        const monthOrders = allOrders?.filter(order => 
          format(new Date(order.created_at), 'MMM yyyy') === monthKey
        ) || [];
        
        return {
          name: format(month, 'MMM'),
          revenue: monthOrders.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0),
          orders: monthOrders.length
        };
      });

      setChartData(monthlyData);

      // Top Products processing
      const productMap: Record<string, any> = {};
      orderItems?.forEach((item: any) => {
        const product = item.products;
        if (!product?.name) return;
        
        if (!productMap[product.name]) {
          productMap[product.name] = { 
            name: product.name, 
            sales: 0, 
            revenue: 0, 
            image: product.image_url 
          };
        }
        productMap[product.name].sales += Number(item.quantity) || 0;
        productMap[product.name].revenue += Number(item.subtotal) || 0;
      });

      const sortedProducts = Object.values(productMap)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 4);
      
      setTopProducts(sortedProducts);

      // Pie Chart Data
      const pieData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value as number
      }));

      setOrderStatusData(pieData);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Gathering Real-time Intelligence...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Performance</h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium">Real-time growth insights from database</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-600 text-sm shadow-sm">
            <Calendar size={18} />
            <span className="hidden sm:inline">All Time</span>
          </button>
          <button 
            onClick={() => fetchAnalyticsData()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
          >
            <Activity size={18} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8 lg:mb-10">
        {[
          { label: 'Total Revenue', value: `₹${(stats.revenue / 100000).toFixed(2)}L`, trend: '+100%', icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Orders', value: stats.orders.toString(), trend: '+100%', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Real Customers', value: stats.customers.toString(), trend: '+100%', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Avg Order', value: `₹${stats.avgOrderValue.toFixed(0)}`, trend: 'Live', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
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
                "text-[10px] lg:text-xs font-black px-1.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-600"
              )}>
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 mb-8 lg:mb-10">
        <div className="card-premium p-5 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Revenue Growth</h3>
              <p className="text-xs lg:text-sm text-slate-500">Live database performance trends</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-[10px] lg:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Live Tracker</span>
            </div>
          </div>
          
          <div className="h-[250px] lg:h-[350px] w-full -ml-4 lg:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                  data={orderStatusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {orderStatusData.map((status, i) => (
              <div key={status.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-black text-slate-500 uppercase">{status.name}</span>
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
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl group hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden shadow-sm">
                    <img src={product.image || 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=100'} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm lg:text-base text-slate-800 dark:text-white group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-[10px] lg:text-xs text-slate-400 font-medium">{product.sales} Units Sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white text-sm lg:text-base">₹{product.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Gross Revenue</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-400 font-bold">No sales data yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
 
export default AnalyticsPage;
