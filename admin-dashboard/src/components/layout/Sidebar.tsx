"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Store,
  Layers,
  PieChart,
  Truck,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useStore';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (val: boolean) => void;
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/analytics' },
  { name: 'Live Orders', icon: ShoppingCart, href: '/admin/orders', badge: '5' },
  { name: 'Products', icon: Package, href: '/admin/products' },
  { name: 'Inventory', icon: Layers, href: '/admin/inventory' },
  { name: 'Categories', icon: Layers, href: '/admin/categories' },
  { name: 'Customers', icon: Users, href: '/admin/customers' },
  { name: 'Analytics', icon: PieChart, href: '/admin/analytics' },
  { name: 'Delivery Settings', icon: Truck, href: '/admin/settings/delivery' },
  { name: 'Settings', icon: Settings, href: '/admin/settings' },
];

const Sidebar = ({ isCollapsed, setIsCollapsed, isOpenMobile, setIsOpenMobile }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentStore } = useAppStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const dynamicMenuItems = [
    ...menuItems.filter(item => item.name !== 'Delivery Settings'),
    { 
      name: 'Delivery Settings', 
      icon: Truck, 
      href: currentStore ? `/admin/store/${currentStore.id}/settings/delivery` : '/admin/settings/delivery' 
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-black text-xl">J</span>
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-black text-xl tracking-tighter text-slate-900 dark:text-white"
            >
              Juicy App
            </motion.span>
          )}
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {dynamicMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={() => setIsOpenMobile(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary"
              )}
            >
              <item.icon size={22} className={cn("shrink-0", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              )}
              {item.badge && !isCollapsed && (
                <span className={cn(
                  "ml-auto px-2 py-0.5 rounded-full text-[10px] font-black",
                  isActive ? "bg-white text-primary" : "bg-primary/10 text-primary"
                )}>
                  {item.badge}
                </span>
              )}
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={22} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpenMobile(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isOpenMobile ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-950 z-50 lg:hidden shadow-2xl"
      >
        {sidebarContent}
      </motion.aside>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:block sticky top-0 h-screen bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 z-30",
          isCollapsed ? "w-24" : "w-72"
        )}
      >
        {sidebarContent}
        
        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-primary shadow-premium transition-all"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
