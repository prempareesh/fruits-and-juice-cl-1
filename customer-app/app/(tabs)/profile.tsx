import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
  Switch
} from 'react-native';
import { User, MapPin, Settings, HelpCircle, ChevronRight, LogOut, Mail, Phone, Briefcase, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../src/store/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Preetham G.',
    email: 'preetham@example.com',
    phone: '+91 98765 43210',
    permanentAddress: '123, Green Valley, Hyderabad',
    officeAddress: 'Tech Park, Madhapur, Hyderabad'
  });
  const [isAdmin, setIsAdmin] = useState(false);

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isAddressModalVisible, setAddressModalVisible] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...profile });
  
  const [settings, setSettings] = useState({
    notifications: true,
    orderUpdates: true
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userData = {
        name: user.user_metadata?.full_name || 'User',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        permanentAddress: user.user_metadata?.permanent_address || '',
        officeAddress: user.user_metadata?.office_address || ''
      };
      setProfile(userData);
      setTempProfile(userData);

      // Check if user is admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileData?.role === 'admin') {
        setIsAdmin(true);
      }
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: tempProfile.name,
          phone: tempProfile.phone,
          permanent_address: tempProfile.permanentAddress,
          office_address: tempProfile.officeAddress,
        }
      });

      if (error) throw error;

      setProfile({ ...tempProfile });
      setEditModalVisible(false);
      setAddressModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) console.warn("Supabase signout issue:", error.message);
      } catch (error: any) {
        console.error('Logout error:', error.message);
      } finally {
        setLoading(false);
        // Clear any local storage that might be stuck
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
        router.replace('/login');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to log out?')) {
        await performLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const renderSettingRow = (label: string, value: boolean, onValueChange: (v: boolean) => void) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: '#e2e8f0', true: '#ffedd5' }}
        thumbColor={value ? '#FF7700' : '#94a3b8'}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' }} 
            style={[styles.avatar, { borderColor: theme.primaryLight }]}
          />
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Settings size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
        <Text style={[styles.phone, { color: theme.textSecondary }]}>{profile.phone}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
          <View style={[styles.iconContainer, { backgroundColor: '#3b82f615' }]}>
            <User size={22} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>Edit Profile</Text>
            <Text style={styles.menuSubtitle}>Name, Email, Phone</Text>
          </View>
          <ChevronRight size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <TouchableOpacity style={styles.menuItem} onPress={() => setAddressModalVisible(true)}>
          <View style={[styles.iconContainer, { backgroundColor: '#10b98115' }]}>
            <MapPin size={22} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>Saved Addresses</Text>
            <Text style={styles.menuSubtitle}>{profile.permanentAddress ? 'Permanent & Office set' : 'Add delivery addresses'}</Text>
          </View>
          <ChevronRight size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.sectionTitle}>Addresses</Text>
        <View style={styles.addressRow}>
          <Home size={20} color={theme.textSecondary} />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Permanent Address</Text>
            <Text style={[styles.addressText, { color: theme.text }]}>{profile.permanentAddress || 'Not set'}</Text>
          </View>
        </View>
        <View style={styles.addressRow}>
          <Briefcase size={20} color={theme.textSecondary} />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Office Address</Text>
            <Text style={[styles.addressText, { color: theme.text }]}>{profile.officeAddress || 'Not set'}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        {isAdmin && (
          <>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/admin')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FF770015' }]}>
                <Settings size={22} color="#FF7700" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: theme.text }]}>Admin Dashboard</Text>
                <Text style={styles.menuSubtitle}>Manage orders, products & stats</Text>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          </>
        )}
        {renderSettingRow('Push Notifications', settings.notifications, (v) => setSettings({...settings, notifications: v}))}
        {renderSettingRow('Order Updates', settings.orderUpdates, (v) => setSettings({...settings, orderUpdates: v}))}
        {renderSettingRow('Dark Mode', isDarkMode, toggleDarkMode)}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => Alert.alert('Help & Support', 'Admin: Preetam Gaur\nEmail: PreetamGaur2006@gmail.com\n\nHow can we help you today?')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#f59e0b15' }]}>
            <HelpCircle size={22} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>Help & Support</Text>
            <Text style={styles.menuSubtitle}>Contact Preetam Gaur</Text>
          </View>
          <ChevronRight size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={22} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.textSecondary }]}>Version 1.2.0 (Production)</Text>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={tempProfile.name}
                  onChangeText={(v) => setTempProfile({ ...tempProfile, name: v })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput 
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={tempProfile.phone}
                  onChangeText={(v) => setTempProfile({ ...tempProfile, phone: v })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, opacity: 0.7 }]}
                  value={tempProfile.email}
                  editable={false}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: theme.background }]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Address Modal */}
      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Manage Addresses</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Permanent Address</Text>
                <TextInput 
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 100 }]}
                  value={tempProfile.permanentAddress}
                  onChangeText={(v) => setTempProfile({ ...tempProfile, permanentAddress: v })}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Office Address</Text>
                <TextInput 
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 100 }]}
                  value={tempProfile.officeAddress}
                  onChangeText={(v) => setTempProfile({ ...tempProfile, officeAddress: v })}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: theme.background }]} 
                onPress={() => setAddressModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Update Addresses'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  editBtn: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#FF7700', width: 32, height: 32,
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  name: { fontSize: 22, fontWeight: 'bold' },
  phone: { fontSize: 14, marginTop: 4 },
  section: {
    marginTop: 20, marginHorizontal: 20,
    borderRadius: 24, padding: 16, borderWidth: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuLabel: { fontSize: 16, fontWeight: '600' },
  menuSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, marginVertical: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  addressInfo: { flex: 1, marginLeft: 12 },
  addressLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  addressText: { fontSize: 14, marginTop: 2 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 32, marginHorizontal: 20, padding: 18,
    backgroundColor: '#fff1f2', borderRadius: 20,
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginLeft: 12 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 24, marginBottom: 40 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  modalInput: { borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center' },
  cancelBtn: {},
  saveBtn: { backgroundColor: '#FF7700' },
  cancelBtnText: { fontWeight: 'bold' },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
});
