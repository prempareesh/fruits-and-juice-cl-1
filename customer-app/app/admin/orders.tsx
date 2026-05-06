import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  useWindowDimensions,
  Platform
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, Package, XCircle, User, MapPin, ChevronDown } from 'lucide-react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderStatus = 'received' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  address: string | null;
  payment_type: string | null;
  delivery_type: string | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; label: string; Icon: any }> = {
  received:   { color: '#F59E0B', bg: '#FEF3C7', label: 'Received',      Icon: Clock },
  processing: { color: '#3B82F6', bg: '#DBEAFE', label: 'Processing',    Icon: Package },
  completed:  { color: '#10B981', bg: '#D1FAE5', label: 'Completed',     Icon: CheckCircle },
  cancelled:  { color: '#EF4444', bg: '#FEE2E2', label: 'Not Completed', Icon: XCircle },
};

const TAB_STATUSES: OrderStatus[] = ['received', 'processing', 'completed', 'cancelled'];

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <CheckCircle size={16} color="#fff" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Status Segmented Control ─────────────────────────────────────────────────

function StatusControl({
  currentStatus,
  orderId,
  onUpdate,
  isLoading,
}: {
  currentStatus: OrderStatus;
  orderId: string;
  onUpdate: (id: string, status: OrderStatus) => void;
  isLoading: boolean;
}) {
  const options: { status: OrderStatus; label: string }[] = [
    { status: 'received',   label: 'Received' },
    { status: 'processing', label: 'Processing' },
    { status: 'completed',  label: 'Completed' },
    { status: 'cancelled',  label: 'Not Completed' },
  ];

  return (
    <View style={styles.segmentContainer}>
      <Text style={styles.segmentLabel}>UPDATE STATUS</Text>
      <View style={styles.segmentRow}>
        {options.map(({ status, label }) => {
          const cfg = STATUS_CONFIG[status];
          const isActive = currentStatus === status;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.segmentBtn,
                { borderColor: cfg.color, backgroundColor: isActive ? cfg.color : '#fff' },
              ]}
              onPress={() => {
                if (!isLoading && !isActive) onUpdate(orderId, status);
              }}
              disabled={isLoading || isActive}
              activeOpacity={0.7}
            >
              {isLoading && isActive ? (
                <ActivityIndicator size="small" color={cfg.color} />
              ) : (
                <Text style={[styles.segmentText, { color: isActive ? '#fff' : cfg.color }]}>
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  item,
  onUpdate,
  isLoading,
}: {
  item: Order;
  onUpdate: (id: string, status: OrderStatus) => void;
  isLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[item.status];
  const Icon = cfg.Icon;

  return (
    <View style={styles.orderCard}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Icon size={13} color={cfg.color} />
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <User size={14} color={COLORS.mutedGray} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.profiles?.full_name || 'Anonymous'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={14} color={COLORS.mutedGray} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.address || (item.delivery_type === 'pickup' ? 'Pickup' : 'No address')}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.orderFooterRow}>
        <View>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>₹{item.total_amount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.expandBtn, { backgroundColor: cfg.color + '15' }]}
          onPress={() => setExpanded(prev => !prev)}
        >
          <Text style={[styles.expandBtnText, { color: cfg.color }]}>
            {expanded ? 'Hide Controls' : 'Change Status'}
          </Text>
          <ChevronDown
            size={14}
            color={cfg.color}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {/* Status Control – only shown when expanded */}
      {expanded && (
        <StatusControl
          currentStatus={item.status}
          orderId={item.id}
          onUpdate={(id, status) => {
            onUpdate(id, status);
            // Keep expanded so admin can switch again
          }}
          isLoading={isLoading}
        />
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrderManagement() {

  const { width: rnWidth } = useWindowDimensions();
  const [width, setWidth] = useState(Platform.OS === 'web' ? window.innerWidth : rnWidth);
  const isLarge = width > 768;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (rnWidth > 0) setWidth(rnWidth);
  }, [rnWidth]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderStatus>('received');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState({ visible: false, message: '' });

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  // ── Fetch all orders ──────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name, phone), order_items(*, products(*))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err: any) {
      Alert.alert('Error loading orders', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Update order status ────────────────────────────────────────────────────
  const updateStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      if (updatingIds.has(orderId)) return;

      // 1. Mark as updating
      setUpdatingIds(prev => new Set(prev).add(orderId));

      // 2. Optimistic update so UI reflects immediately
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );

      try {
        // 3. Persist to Supabase
        const { error } = await supabase
          .from('orders')
          .update({ status: nextStatus })
          .eq('id', orderId);

        if (error) {
          // Rollback optimistic update on error
          await fetchOrders(true);
          throw error;
        }

        // 4. Show success toast
        const label = STATUS_CONFIG[nextStatus].label;
        showToast(`✓ Order moved to "${label}"`);

        // 5. Background sync (quiet — no spinner)
        fetchOrders(true);
      } catch (err: any) {
        Alert.alert('Update failed', err.message);
      } finally {
        // 6. Remove from updating set
        setUpdatingIds(prev => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [updatingIds, fetchOrders]
  );

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders(true) // quiet refresh on external change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  const filteredOrders = orders.filter(o => o.status === activeTab);
  const countFor = (s: OrderStatus) => orders.filter(o => o.status === s).length;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      {/* Tab bar */}
      <View style={[styles.tabBar, isLarge && styles.tabBarLarge]}>
        <View style={isLarge ? styles.tabRowLarge : { flexDirection: 'row', flex: 1, gap: 6 }}>
          {TAB_STATUSES.map(status => {
            const cfg = STATUS_CONFIG[status];
            const isActive = activeTab === status;
            const count = countFor(status);
            return (
              <TouchableOpacity
                key={status}
                style={[styles.tab, isActive && { backgroundColor: cfg.bg }, isLarge && styles.tabLarge]}
                onPress={() => setActiveTab(status)}
              >
                <Text style={[styles.tabLabel, isActive && { color: cfg.color }, isLarge && { fontSize: 13 }]}>
                  {cfg.label}
                </Text>
                <View style={[styles.tabBadge, { backgroundColor: isActive ? cfg.color : COLORS.border }]}>
                  <Text style={[styles.tabBadgeText, { color: isActive ? '#fff' : COLORS.mutedGray }]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        </View>
      ) : (
        <FlatList
          key={isLarge ? 'grid' : 'list'}
          data={filteredOrders}
          keyExtractor={item => item.id}
          numColumns={isLarge ? 2 : 1}
          columnWrapperStyle={isLarge ? { gap: 24 } : null}
          contentContainerStyle={[styles.listContent, isLarge && styles.listContentLarge]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              colors={[COLORS.primaryGreen]}
            />
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <OrderCard
                item={item}
                onUpdate={updateStatus}
                isLoading={updatingIds.has(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={64} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No orders here</Text>
              <Text style={styles.emptySubtitle}>
                There are currently no "{STATUS_CONFIG[activeTab].label}" orders.
              </Text>
            </View>
          }
        />
      )}

      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  containerLarge: { backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBarLarge: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  tabRowLarge: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLarge: {
    flex: 0,
    minWidth: 140,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedGray,
    textAlign: 'center',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800' },

  // List
  listContent: { padding: 16, paddingBottom: 60 },
  listContentLarge: {
    padding: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  // Order card
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderId: { fontSize: 15, fontWeight: '800', color: COLORS.darkText },
  orderTime: { fontSize: 12, color: COLORS.mutedGray, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  infoGrid: { gap: 6, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: COLORS.darkText, flex: 1 },

  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  amountLabel: { fontSize: 11, color: COLORS.mutedGray, fontWeight: '600' },
  amountValue: { fontSize: 20, fontWeight: '800', color: COLORS.primaryGreen },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  expandBtnText: { fontSize: 12, fontWeight: '700' },

  // Segmented control
  segmentContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  segmentLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mutedGray,
    letterSpacing: 1,
    marginBottom: 10,
  },
  segmentRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  segmentBtn: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.darkText },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.mutedGray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
