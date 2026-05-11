"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  ChevronDown,
  Store,
  Moon,
  Sun
} from 'lucide-react';
import { useAppStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const { currentStore } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => setIsOpenMobile(true)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Menu size={22} />
              </button>
              
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none w-full max-w-md group">
                <Search className="text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search commands, orders..." 
                  className="bg-transparent border-none outline-none w-full text-sm font-medium"
                />
              </div>

              {/* Mobile Store Badge */}
              <div className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl">
                <Store size={14} className="text-primary" />
                <span className="text-xs font-black text-primary truncate max-w-[100px]">
                  {currentStore?.name || 'Main Store'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <button className="hidden sm:flex p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
              </button>
              
              <button className="hidden sm:flex p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <Moon size={20} className="hidden dark:block" />
                <Sun size={20} className="dark:hidden" />
              </button>

              <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block" />

              <button className="flex items-center gap-2 p-1.5 lg:p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white font-black text-xs">
                  A
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">Admin User</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Super Admin</p>
                </div>
                <ChevronDown size={14} className="text-slate-400 ml-1 hidden lg:block" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-10 scroll-smooth custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-auto w-full max-w-[1600px]"
          >
            {children}
          </motion.div>
          
          {/* Mobile Bottom Spacer for Floating Actions */}
          <div className="h-20 lg:hidden" />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
