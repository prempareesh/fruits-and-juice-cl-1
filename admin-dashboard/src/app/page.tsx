"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const CUSTOMER_APP_URL = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || "http://192.168.1.7:8081";

      if (!session) {
        window.location.href = `${CUSTOMER_APP_URL}/login`;
        return;
      }

      const userEmail = session.user.email;
      const ADMIN_EMAIL = "preethamgoud2006@gmail.com";

      // STRICT LOGIC: ONLY the specific admin email gets to the dashboard
      if (userEmail === ADMIN_EMAIL) {
        console.log("Admin identified, redirecting to dashboard...");
        router.replace('/admin/dashboard');
      } else {
        // Everyone else is a customer, period.
        console.log("Customer identified, redirecting to customer app...");
        window.location.href = CUSTOMER_APP_URL;
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium font-outfit">Redirecting you to the right place...</p>
      </div>
    </div>
  );
}
