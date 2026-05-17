import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { X, User, Phone, MapPin, Calendar, CreditCard, ShoppingBag, CheckCircle, Truck, Package, XCircle, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../../lib/supabase';

interface AdminOrderModalProps {
  visible: boolean;
  onClose: () => void;
  order: any;
  onStatusUpdate: () => void;
}

const STATUS_FLOW = [
  { label: 'PENDING', color: '#f59e0b', icon: Clock },
  { label: 'PREPARING', color: '#3b82f6', icon: Package },
  { label: 'OUT_FOR_DELIVERY', color: '#8b5cf6', icon: Truck },
  { label: 'DELIVERED', color: '#10b981', icon: CheckCircle },
  { label: 'CANCELLED', color: '#ef4444', icon: XCircle },
];

export const AdminOrderModal = ({ visible, onClose, order, onStatusUpdate }: AdminOrderModalProps) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [fetchingItems, setFetchingItems] = useState(false);

  useEffect(() => {
    if (visible && order) {
      fetchOrderItems();
    }
  }, [visible, order]);

  const fetchOrderItems = async () => {
    setFetchingItems(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name, image_url, quantity)
        `)
        .eq('order_id', order.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    } finally {
      setFetchingItems(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      onStatusUpdate();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={FadeInUp.springify().damping(15)}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Text style={styles.orderIdText}>#{order.id.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Status Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Status</Text>
              <View style={styles.statusGrid}>
                {STATUS_FLOW.map((s) => {
                  const Icon = s.icon;
                  const isActive = order.status === s.label;
                  return (
                    <TouchableOpacity 
                      key={s.label} 
                      style={[
                        styles.statusBtn, 
                        { borderColor: s.color },
                        isActive && { backgroundColor: s.color }
                      ]}
                      onPress={() => updateStatus(s.label)}
                      disabled={loading}
                    >
                      <Icon size={16} color={isActive ? '#fff' : s.color} />
                      <Text style={[styles.statusBtnText, { color: isActive ? '#fff' : s.color }]}>
                        {s.label.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <User size={18} color="#64748b" />
                  <Text style={styles.infoText}>{order.profiles?.full_name || 'Guest User'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Phone size={18} color="#64748b" />
                  <Text style={styles.infoText}>{order.profiles?.phone || 'No phone provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={18} color="#64748b" />
                  <Text style={styles.infoText}>{order.address || 'Standard Delivery'}</Text>
                </View>
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              {fetchingItems ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <View style={styles.itemsList}>
                  {items.map((item, idx) => (
                    <View key={item.id} style={[styles.itemRow, idx === items.length - 1 && { borderBottomWidth: 0 }]}>
                      <Image 
                        source={{ uri: item.products?.image_url || 'https://via.placeholder.com/100' }} 
                        style={styles.itemImage} 
                      />
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemName}>{item.products?.name}</Text>
                        <Text style={styles.itemQty}>Qty: {item.quantity} x ₹{item.price}</Text>
                      </View>
                      <Text style={styles.itemTotal}>₹{item.quantity * item.price}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Payment Details */}
            <View style={styles.section}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>₹{order.total_amount}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Delivery Fee</Text>
                <Text style={styles.totalValue}>₹0</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{order.total_amount}</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  orderIdText: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '600' },
  closeBtn: { padding: 4 },
  scrollContent: { flex: 1 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 6 },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  infoCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 14, color: '#475569', fontWeight: '500', flex: 1 },
  itemsList: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f1f5f9' },
  itemMeta: { marginLeft: 12, flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  itemQty: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#64748b' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  grandTotalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  grandTotalLabel: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  grandTotalValue: { fontSize: 20, fontWeight: '800', color: '#10b981' }
});
