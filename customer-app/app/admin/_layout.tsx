import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Slot, useRouter, usePathname } from 'expo-router';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Boxes, 
  Users, 
  LineChart, 
  Settings, 
  LogOut,
  Menu,
  X,
  ExternalLink
} from 'lucide-react-native';
import { useAuth } from '../../src/providers/AuthProvider';

const ADMIN_ROUTES = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/categories', label: 'Categories', icon: Tags },
  { path: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  
  const { session, role, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  // Protected route logic is handled by AuthProvider, but we add a secondary check here
  useEffect(() => {
    if (!loading && (!session || role !== 'admin')) {
      router.replace('/login');
    }
  }, [session, role, loading]);

  const handleNavigate = (path: string) => {
    router.push(path as any);
    if (!isDesktop) setSidebarOpen(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Verifying Admin Access...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mobile Header */}
      {!isDesktop && (
        <View style={[styles.mobileHeader, { paddingTop: insets.top, height: 60 + insets.top }]}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
            <Menu size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.mobileHeaderTitle}>Admin Panel</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <View style={styles.main}>
        {/* Sidebar */}
        {(sidebarOpen || isDesktop) && (
          <View style={[styles.sidebar, !isDesktop && styles.mobileSidebar]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Padmavati</Text>
              <Text style={styles.sidebarSubtitle}>Admin Dashboard</Text>
              {!isDesktop && (
                <TouchableOpacity onPress={() => setSidebarOpen(false)} style={styles.closeBtn}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.sidebarContent} contentContainerStyle={{ gap: 8 }}>
              {ADMIN_ROUTES.map((route) => {
                const isActive = pathname === route.path || (route.path !== '/admin' && pathname.startsWith(route.path));
                const Icon = route.icon;
                return (
                  <TouchableOpacity
                    key={route.path}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                    onPress={() => handleNavigate(route.path)}
                  >
                    <Icon size={20} color={isActive ? '#10b981' : '#64748b'} />
                    <Text style={[styles.navText, isActive && styles.navTextActive]}>
                      {route.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sidebarSection}>
              <TouchableOpacity 
                style={styles.viewStoreBtn}
                onPress={() => router.push('/(tabs)')}
              >
                <ExternalLink size={18} color="#10b981" />
                <Text style={styles.viewStoreText}>View Store</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mobile Sidebar Overlay */}
        {!isDesktop && sidebarOpen && (
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={() => setSidebarOpen(false)} 
          />
        )}

        {/* Main Content Area */}
        <View style={styles.content}>
          {isDesktop && (
            <View style={styles.desktopHeader}>
              <Text style={styles.desktopHeaderTitle}>
                {ADMIN_ROUTES.find(r => r.path === pathname)?.label || 'Dashboard'}
              </Text>
            </View>
          )}
          <View style={styles.slotContainer}>
            <Slot />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 16, color: '#64748b', fontWeight: '600' },
  mobileHeader: { height: 60, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', zIndex: 10 },
  menuBtn: { padding: 4 },
  mobileHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  main: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0', display: 'flex', flexDirection: 'column' },
  mobileSidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 50, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  sidebarHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', position: 'relative' },
  sidebarTitle: { fontSize: 24, fontWeight: '900', color: '#10b981', letterSpacing: -0.5 },
  sidebarSubtitle: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  closeBtn: { position: 'absolute', top: 24, right: 16, padding: 4 },
  sidebarContent: { flex: 1, padding: 16 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  navItemActive: { backgroundColor: '#ecfdf5' },
  navText: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#64748b' },
  navTextActive: { color: '#10b981', fontWeight: '700' },
  sidebarFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#fef2f2' },
  logoutText: { marginLeft: 12, fontSize: 15, fontWeight: '700', color: '#ef4444' },
  sidebarSection: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  viewStoreBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f0fdf4', gap: 12 },
  viewStoreText: { fontSize: 15, fontWeight: '700', color: '#10b981' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 },
  content: { flex: 1, display: 'flex', flexDirection: 'column' },
  desktopHeader: { height: 72, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', justifyContent: 'center', paddingHorizontal: 32 },
  desktopHeaderTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  slotContainer: { flex: 1 }
});
