import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { 
  Store, 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  Save, 
  ExternalLink,
  Navigation
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    store_live: true,
    service_radius_km: '10',
    minimum_order: '100',
    delivery_fee: '20',
    warehouse_address: '',
    latitude: '14.4351',
    longitude: '79.9674',
    support_phone: '+91 98765 43210',
    delivery_time: '30-45 mins'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'store_settings')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Handle both old and new column names for backward compatibility during migration
        setSettings({
          store_live: data.store_live ?? data.store_open ?? true,
          service_radius_km: String(data.service_radius_km ?? data.delivery_radius ?? '10'),
          minimum_order: String(data.minimum_order ?? data.min_order_amount ?? '100'),
          delivery_fee: String(data.delivery_fee ?? data.base_delivery_fee ?? '20'),
          warehouse_address: data.warehouse_address ?? data.store_address ?? '',
          latitude: String(data.latitude ?? data.store_lat ?? '14.4351'),
          longitude: String(data.longitude ?? data.store_lng ?? '79.9674'),
          support_phone: data.support_phone ?? '+91 98765 43210',
          delivery_time: data.delivery_time ?? data.estimated_delivery_time ?? '30-45 mins'
        });
      }
    } catch (error: any) {
      console.error('Fetch Settings Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // We upsert using the NEW column names. 
      // IMPORTANT: User must run the migration script first.
      const payload: any = {
        id: 'store_settings',
        store_live: settings.store_live,
        service_radius_km: parseFloat(settings.service_radius_km),
        minimum_order: parseFloat(settings.minimum_order),
        delivery_fee: parseFloat(settings.delivery_fee),
        warehouse_address: settings.warehouse_address,
        latitude: parseFloat(settings.latitude),
        longitude: parseFloat(settings.longitude),
        support_phone: settings.support_phone,
        delivery_time: settings.delivery_time,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('settings')
        .upsert(payload);

      if (error) {
        console.error('Save Error:', error);
        // Fallback for old schema if migration hasn't been run yet
        if (error.message.includes('column') || error.code === '42703') {
           const fallbackPayload = {
              id: 'store_settings',
              store_open: settings.store_live,
              delivery_radius: parseFloat(settings.service_radius_km),
              min_order_amount: parseFloat(settings.minimum_order),
              base_delivery_fee: parseFloat(settings.delivery_fee),
              store_address: settings.warehouse_address,
              store_lat: parseFloat(settings.latitude),
              store_lng: parseFloat(settings.longitude),
              support_phone: settings.support_phone,
              estimated_delivery_time: settings.delivery_time,
              updated_at: new Date().toISOString()
           };
           const { error: fallbackError } = await supabase.from('settings').upsert(fallbackPayload);
           if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }
      
      Alert.alert("Success", "Configuration saved permanently to cloud.");
      await fetchSettings(); // Reload to confirm persistence
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to exit the admin panel?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Store Settings</Text>
          <Text style={styles.subtitle}>Manage logistics, hub location, and support</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewStoreBtn}
          onPress={() => router.push('/(tabs)')}
        >
          <ExternalLink size={18} color="#10b981" />
          <Text style={styles.viewStoreText}>Preview App</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Status Card */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.statusCard}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusIndicator, { backgroundColor: settings.store_live ? '#10b981' : '#ef4444' }]} />
          <View>
            <Text style={styles.statusTitle}>{settings.store_live ? 'Store is Live' : 'Store is Closed'}</Text>
            <Text style={styles.statusDesc}>{settings.store_live ? 'Accepting orders normally' : 'Customers cannot checkout'}</Text>
          </View>
        </View>
        <Switch 
          value={settings.store_live} 
          onValueChange={(val) => setSettings(s => ({ ...s, store_live: val }))}
          trackColor={{ false: '#cbd5e1', true: '#10b981' }}
        />
      </Animated.View>

      <View style={styles.sectionsGrid}>
        {/* Logistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery & Logistics</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Radius (KM)</Text>
                <View style={styles.inputWrapper}>
                  <Truck size={16} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    value={settings.service_radius_km} 
                    onChangeText={(val) => setSettings(s => ({ ...s, service_radius_km: val }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Delivery Fee (₹)</Text>
                <View style={styles.inputWrapper}>
                  <Navigation size={16} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    value={settings.delivery_fee} 
                    onChangeText={(val) => setSettings(s => ({ ...s, delivery_fee: val }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Minimum Order (₹)</Text>
                <TextInput 
                  style={[styles.input, styles.standaloneInput]} 
                  value={settings.minimum_order} 
                  onChangeText={(val) => setSettings(s => ({ ...s, minimum_order: val }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Delivery Time</Text>
                <View style={styles.inputWrapper}>
                  <Clock size={16} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    value={settings.delivery_time} 
                    onChangeText={(val) => setSettings(s => ({ ...s, delivery_time: val }))}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Hub Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hub Location & GIS</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Warehouse Address</Text>
              <View style={[styles.inputWrapper, { height: 'auto', minHeight: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
                <MapPin size={18} color="#94a3b8" style={{ marginTop: 2 }} />
                <TextInput 
                  style={[styles.input, { height: 'auto' }]} 
                  multiline
                  value={settings.warehouse_address}
                  onChangeText={(val) => setSettings(s => ({ ...s, warehouse_address: val }))}
                  placeholder="Enter full address for GPS positioning"
                />
              </View>
            </View>

            <View style={[styles.inputRow, { marginTop: 16 }]}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput 
                  style={[styles.input, styles.standaloneInput]} 
                  value={settings.latitude}
                  onChangeText={(val) => setSettings(s => ({ ...s, latitude: val }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput 
                  style={[styles.input, styles.standaloneInput]} 
                  value={settings.longitude}
                  onChangeText={(val) => setSettings(s => ({ ...s, longitude: val }))}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Support</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Support Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Phone size={16} color="#94a3b8" />
                <TextInput 
                  style={styles.input} 
                  value={settings.support_phone} 
                  onChangeText={(val) => setSettings(s => ({ ...s, support_phone: val }))}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
          onPress={handleSave} 
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save All Settings</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Exit Admin Panel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },
  viewStoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  viewStoreText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  statusCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  statusInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
  statusTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statusDesc: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
  sectionsGrid: { gap: 32 },
  section: { },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  inputRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  inputGroup: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  standaloneInput: { height: 56, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16 },
  footer: { marginTop: 40, gap: 16, paddingBottom: 60 },
  saveBtn: { flexDirection: 'row', height: 64, backgroundColor: '#10b981', borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  logoutBtn: { flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  logoutBtnText: { color: '#64748b', fontSize: 15, fontWeight: '800' }
});
