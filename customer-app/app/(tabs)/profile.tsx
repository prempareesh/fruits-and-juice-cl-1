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
  Switch,
  Linking
} from 'react-native';
import { User, MapPin, Settings, HelpCircle, ChevronRight, LogOut, Briefcase, Home, ShieldCheck, Phone, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../src/store/ThemeContext';
import { useAuth } from '../../src/providers/AuthProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const { user, role, signOut, refreshProfile, profile: authProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: 'User',
    email: '',
    phone: '',
    permanentAddress: '',
    officeAddress: ''
  });

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isAddressModalVisible, setAddressModalVisible] = useState(false);
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...profile });
  
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: false 
  });

  useEffect(() => {
    if (user) {
      const userData = {
        name: authProfile?.full_name || user.user_metadata?.full_name || 'User',
        email: user.email || '',
        phone: authProfile?.phone || user.user_metadata?.phone || '',
        permanentAddress: authProfile?.address || user.user_metadata?.permanent_address || '',
        officeAddress: user.user_metadata?.office_address || ''
      };
      setProfile(userData);
      setTempProfile(userData);
    }
  }, [user, authProfile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    console.log('[Profile_Update] Starting update for user:', user.id);
    
    try {
      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: tempProfile.name,
          phone: tempProfile.phone,
          permanent_address: tempProfile.permanentAddress,
          office_address: tempProfile.officeAddress,
        }
      });
      if (authError) throw authError;

      // 2. Update Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: tempProfile.name,
          phone: tempProfile.phone,
          address: tempProfile.permanentAddress,
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.warn('[Profile_Update] Profile table sync failed:', profileError.message);
      }

      // 3. Refresh Global State
      if (refreshProfile) await refreshProfile();

      setProfile({ ...tempProfile });
      setEditModalVisible(false);
      setAddressModalVisible(false);
      
      Alert.alert(
        'Success', 
        'Address and profile updated successfully',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[Profile_Update_Error]', error);
      Alert.alert('Update Failed', error.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await signOut();
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
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{profile.email}</Text>
          <View style={[styles.badge, { backgroundColor: role === 'admin' ? '#FF770020' : '#10b98120' }]}>
            <Text style={[styles.badgeText, { color: role === 'admin' ? '#FF7700' : '#10b981' }]}>
              {role === 'admin' ? 'Administrator' : 'Customer'}
            </Text>
          </View>
        </View>
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
        <Text style={styles.sectionTitle}>App Settings</Text>
        {role === 'admin' && (
          <>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.replace('/admin')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FF770015' }]}>
                <ShieldCheck size={22} color="#FF7700" />
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
        {renderSettingRow('Dark Mode', isDarkMode, toggleDarkMode)}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => setHelpModalVisible(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#f59e0b15' }]}>
            <HelpCircle size={22} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>Help & Support</Text>
            <Text style={styles.menuSubtitle}>Contact Support Team</Text>
          </View>
          <ChevronRight size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={22} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.textSecondary }]}>Version 2.0.0 (Stable Auth)</Text>

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
      {/* Help & Support Modal */}
      <Modal
        visible={isHelpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>Help & Support</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.supportContainer}>
              <View style={[styles.supportCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#3b82f615' }]}>
                  <Mail size={24} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportLabel, { color: theme.textSecondary }]}>Email Us</Text>
                  <Text style={[styles.supportValue, { color: theme.text }]}>support@freshflow.com</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.supportActionBtn, { backgroundColor: '#3b82f6' }]}
                  onPress={() => Linking.openURL('mailto:support@freshflow.com').catch(() => Alert.alert('Error', 'Could not open email app'))}
                >
                  <Text style={styles.supportActionText}>Send Email</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.supportCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#10b98115' }]}>
                  <Phone size={24} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportLabel, { color: theme.textSecondary }]}>Call Us</Text>
                  <Text style={[styles.supportValue, { color: theme.text }]}>+91 98765 43210</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.supportActionBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => Linking.openURL('tel:+919876543210').catch(() => Alert.alert('Error', 'Could not open dialer'))}
                >
                  <Text style={styles.supportActionText}>Call Admin</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.supportNotice}>
                <HelpCircle size={16} color={theme.textSecondary} />
                <Text style={[styles.supportNoticeText, { color: theme.textSecondary }]}>
                  Our support team is available from 9 AM to 9 PM daily.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={[styles.logoutModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.logoutIconBg}>
              <LogOut size={32} color="#ef4444" />
            </View>
            <Text style={[styles.logoutModalTitle, { color: theme.text }]}>Log Out?</Text>
            <Text style={[styles.logoutModalSubtitle, { color: theme.textSecondary }]}>
              Are you sure you want to log out of your account? You'll need to log in again to place orders.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Stay Logged In</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} 
                onPress={confirmLogout}
              >
                <Text style={[styles.saveBtnText, { color: '#FFF' }]}>Yes, Log Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  email: { fontSize: 16, marginTop: 4, opacity: 0.7 },
  badge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  supportContainer: {
    gap: 16,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  supportValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  supportActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  supportActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  supportNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  supportNoticeText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  logoutModalContent: { 
    width: '85%', 
    backgroundColor: '#fff', 
    borderRadius: 32, 
    padding: 32, 
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto'
  },
  logoutIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12
  },
  logoutModalSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10
  }
});
