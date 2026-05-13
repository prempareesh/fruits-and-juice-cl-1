"use client";
 
import React, { useState, useEffect } from 'react';
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
  RefreshCcw,
  Download,
  Calendar,
  Loader2
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';
import dynamic from 'next/dynamic';

// Dynamic imports for charts to reduce bundle size and speed up initial load
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

const StatCard = React.memo(({ title, value, icon: Icon, trend, trendValue, color, loading }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="card-premium p-6 flex flex-col gap-4"
  >
    <div className="flex justify-between items-start">
      {loading ? (
        <Skeleton className="w-12 h-12 rounded-2xl" />
      ) : (
        <div className={cn("p-3 rounded-2xl", color)}>
          <Icon size={24} className="text-white" />
        </div>
      )}
      {trend && !loading && (
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
      {loading ? (
        <Skeleton className="h-9 w-28" />
      ) : (
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
      )}
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

const IndianRupee = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="m6 13 8.5 8" />
    <path d="M6 13h3" />
    <path d="M9 13c6.667 0 6.667-10 0-10" />
  </svg>
);

const DashboardPage = () => {
  const { currentStore, setCurrentStore } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [storeName, setStoreName] = useState(currentStore?.name || 'Main');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0
  });

  // Effect to ensure a store is loaded
  useEffect(() => {
    setMounted(true);
    const ensureStore = async () => {
      if (!currentStore) {
        setCurrentStore({
          id: 'default',
          name: 'Main Store',
          location: 'Digital Shop'
        } as any);
        setStoreName('Main Store');
      } else {
        setStoreName(currentStore.name);
      }
    };

    ensureStore();
  }, [currentStore, setCurrentStore]);

  const isFetching = React.useRef(false);

  const fetchDashboardData = React.useCallback(async (isBackground = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (!isBackground) setLoading(true);

      const [ordersResult, productsResult, orderItemsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, total_amount, status, user_id, profiles(full_name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, image_url'),
        supabase
          .from('order_items')
          .select('quantity, subtotal, products(name, image_url)')
      ]);
      
      if (ordersResult.error) throw ordersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (orderItemsResult.error) throw orderItemsResult.error;

      const orders = ordersResult.data || [];
      const products = productsResult.data || [];
      const orderItems = orderItemsResult.data || [];

      const storeSpecificCustomers = new Set((orders as any[]).map(o => o.user_id)).size;

      let totalRevenue = 0;
      const distribution: Record<string, number> = {};
      
      orders.forEach(order => {
        totalRevenue += Number(order.total_amount || 0);
        const status = order.status?.toUpperCase() || 'UNKNOWN';
        distribution[status] = (distribution[status] || 0) + 1;
      });

      setStats({
        revenue: totalRevenue,
        orders: orders.length,
        customers: storeSpecificCustomers,
        products: products.length
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr);
        
        return {
          name: format(date, 'EEE'),
          date: dateStr,
          sales: dayOrders.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0),
          orders: dayOrders.length
        };
      });
      setSalesData(last7Days);

      const productStats: Record<string, any> = {};
      orderItems.forEach((item: any) => {
        const product = item.products;
        if (!product?.name) return;
        if (!productStats[product.name]) {
          productStats[product.name] = { 
            name: product.name, 
            sales: 0, 
            image: product.image_url || 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=100' 
          };
        }
        productStats[product.name].sales += Number(item.quantity) || 0;
      });
      setTopProducts(Object.values(productStats).sort((a: any, b: any) => b.sales - a.sales).slice(0, 4));

      setRecentOrders(orders.slice(0, 5).map(o => {
        const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
        return {
          id: o.id.slice(0, 8),
          customer: profile?.full_name || 'Guest',
          status: o.status,
          amount: Number(o.total_amount || 0),
          time: mounted ? formatDistanceToNow(new Date(o.created_at)) + ' ago' : 'Recently'
        };
      }));

      const distArray = Object.entries(distribution).map(([name, value]) => ({ name, value }));
      setStatusDistribution(distArray);

    } catch (err) {
      console.error('Critical Error in Dashboard Data Fetch:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [mounted]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useRealtime([
    { table: 'orders', callback: () => fetchDashboardData(true) },
    { table: 'products', callback: () => fetchDashboardData(true) },
    { table: 'profiles', callback: () => fetchDashboardData(true) },
    { table: 'order_items', callback: () => fetchDashboardData(true) }
  ]);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{storeName} Analytics</h1>
          <p className="text-slate-500">Real-time performance overview for your business</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchDashboardData()}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.revenue.toLocaleString()}`} 
          icon={IndianRupee} 
          trend="up" 
          trendValue="+100%" 
          color="bg-emerald-500"
          loading={loading}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.orders.toString()} 
          icon={ShoppingCart} 
          trend="up" 
          trendValue="+100%" 
          color="bg-blue-500" 
          loading={loading}
        />
        <StatCard 
          title="Active Customers" 
          value={stats.customers.toString()} 
          icon={Users} 
          color="bg-purple-500" 
          loading={loading}
        />
        <StatCard 
          title="Stock Items" 
          value={stats.products.toString()} 
          icon={Package} 
          color="bg-orange-500" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 card-premium p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-sm text-slate-500">Daily sales performance (7-day trend)</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-full flex flex-col gap-4">
                <div className="flex justify-between items-end h-full px-4 pb-4">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="w-[10%] bg-primary/10 animate-pulse rounded-t-xl" style={{ height: `${20 + (i * 10)}%` }} />
                  ))}
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        <div className="card-premium p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Products</h3>
          <div className="space-y-6">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : topProducts.length === 0 ? (
              <p className="text-center text-slate-400 py-10">No sales data yet.</p>
            ) : topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-slate-500">Total Units Sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{product.sales}</p>
                  <p className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">Sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-premium p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h3>
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
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                      <td className="py-4 pr-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 pr-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-4 pr-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="py-4"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : recentOrders.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300">#{item.id}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-800 dark:text-white">{item.customer}</p>
                      <p className="text-xs text-slate-500">{item.time}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        item.status === 'DELIVERED' || item.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 dark:text-white">₹{item.amount.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-premium p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Order Status Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
              ) : statusDistribution.map((status, i) => (
                <div key={status.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-l-4" style={{ borderColor: COLORS[i % COLORS.length] }}>
                  <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">{status.name}</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{status.value}</span>
                </div>
              ))}
            </div>
            
            <div className="h-[200px] flex items-center justify-center">
              {loading ? (
                <Skeleton className="w-32 h-32 rounded-full" />
              ) : statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-400 text-sm">No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
 
export default DashboardPage;
