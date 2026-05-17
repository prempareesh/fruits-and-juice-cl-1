import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Platform,
  Dimensions,
  TextInput,
  Alert,
  Linking
} from 'react-native';
import { MapPin, Navigation, Home, Briefcase, ChevronRight, X, Search, Plus } from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../providers/AuthProvider';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/tokens';
import * as Location from 'expo-location';
import { LocationService } from '../../services/LocationService';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationModal = ({ visible, onClose }: LocationModalProps) => {
  const { selectedAddress, setSelectedAddress, isCheckingRadius } = useCartStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const savedAddresses = [
    {
      type: 'Home',
      icon: Home,
      address: user?.user_metadata?.permanent_address || '',
      color: '#3b82f6'
    },
    {
      type: 'Office',
      icon: Briefcase,
      address: user?.user_metadata?.office_address || '',
      color: '#10b981'
    }
  ].filter(a => a.address);

  const handleCurrentLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { granted, canAskAgain } = await LocationService.requestPermissions();
      
      if (!granted) {
        if (!canAskAgain) {
          Alert.alert(
            'Location Permission',
            'Location access is required to find your delivery address. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        } else {
          setErrorMsg('Permission to access location was denied');
        }
        return;
      }

      const coords = await LocationService.getCurrentCoords();
      if (!coords) {
        setErrorMsg('Unable to get GPS coordinates. Is your GPS enabled?');
        return;
      }

      const address = await LocationService.reverseGeocode(
        coords.latitude,
        coords.longitude
      );

      if (address) {
        await setSelectedAddress(address);
        Alert.alert('Success', 'Delivery location updated successfully');
        onClose();
      } else {
        setErrorMsg('Could not fetch address. Please enter details manually.');
      }
    } catch (err) {
      console.error('[LOCATION_MODAL_ERROR]', err);
      setErrorMsg('Error fetching location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSaved = async (addrStr: string) => {
    setLoading(true);
    try {
      const coords = await LocationService.geocode(addrStr);
      if (coords) {
        await setSelectedAddress({
          formattedAddress: addrStr,
          latitude: coords.latitude,
          longitude: coords.longitude,
          street: '',
          houseNumber: '',
          area: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          landmark: ''
        } as any);
        onClose();
      } else {
        setErrorMsg('Could not locate this address.');
      }
    } catch (err) {
      setErrorMsg('Error selecting address.');
    } finally {
      setLoading(false);
    }
  };

  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualAddr, setManualAddr] = useState({
    house: '',
    street: '',
    area: '',
    city: 'Nellore', // Default city as per project context
    pincode: ''
  });

  const handleManualSave = async () => {
    const fullAddr = `${manualAddr.house}, ${manualAddr.street}, ${manualAddr.area}, ${manualAddr.city} - ${manualAddr.pincode}`;
    setLoading(true);
    try {
      const coords = await LocationService.geocode(fullAddr);
      if (coords) {
        await setSelectedAddress({
          formattedAddress: fullAddr,
          latitude: coords.latitude,
          longitude: coords.longitude,
          street: manualAddr.street,
          houseNumber: manualAddr.house,
          area: manualAddr.area,
          city: manualAddr.city,
          postalCode: manualAddr.pincode,
          state: '',
          country: '',
          landmark: ''
        });
        onClose();
      } else {
        setErrorMsg('Could not find this location. Please check the details.');
      }
    } catch (err) {
      setErrorMsg('Error saving address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View entering={SlideInDown} style={[styles.content, isManualEntry && { height: '85%' }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isManualEntry ? 'Enter Address' : 'Select Location'}</Text>
              <Text style={styles.subtitle}>{isManualEntry ? 'Provide your exact delivery details' : 'Where do you want your fresh juices?'}</Text>
            </View>
            <TouchableOpacity onPress={isManualEntry ? () => setIsManualEntry(false) : onClose} style={styles.closeBtn}>
              {isManualEntry ? <ChevronRight size={20} color={COLORS.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} /> : <X size={20} color={COLORS.textSecondary} />}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {!isManualEntry ? (
              <>
                {/* Current Location Button */}
                <TouchableOpacity 
                  style={styles.currentLocationBtn} 
                  onPress={handleCurrentLocation}
                  disabled={loading}
                >
                  <View style={styles.iconBg}>
                    {loading ? <ActivityIndicator size="small" color={COLORS.primaryGreen} /> : <Navigation size={20} color={COLORS.primaryGreen} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.btnText}>Use Current Location</Text>
                    <Text style={styles.btnSubtext}>Using GPS for better accuracy</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {/* Error Message */}
                {errorMsg && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* Saved Addresses Section */}
                {savedAddresses.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Saved Addresses</Text>
                    {savedAddresses.map((addr, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.addressCard}
                        onPress={() => handleSelectSaved(addr.address)}
                      >
                        <View style={[styles.addrIconBg, { backgroundColor: addr.color + '15' }]}>
                          <addr.icon size={20} color={addr.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.addrType}>{addr.type}</Text>
                          <Text style={styles.addrText} numberOfLines={2}>{addr.address}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Recently Used */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recently Used</Text>
                  {selectedAddress && (
                    <TouchableOpacity style={styles.addressCard} onPress={onClose}>
                      <View style={[styles.addrIconBg, { backgroundColor: COLORS.primaryGreen + '15' }]}>
                        <MapPin size={20} color={COLORS.primaryGreen} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addrType}>Selected Location</Text>
                        <Text style={styles.addrText} numberOfLines={2}>{selectedAddress.formattedAddress}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.manualForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>House / Flat / Block No.</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 402, Sunshine Apts" 
                    value={manualAddr.house}
                    onChangeText={(v: string) => setManualAddr({...manualAddr, house: v})}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Street / Road / Landmark</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. MG Road, Near Central Park" 
                    value={manualAddr.street}
                    onChangeText={(v: string) => setManualAddr({...manualAddr, street: v})}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Area / Locality</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Jubilee Hills" 
                    value={manualAddr.area}
                    onChangeText={(v: string) => setManualAddr({...manualAddr, area: v})}
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput 
                      style={styles.input} 
                      value={manualAddr.city}
                      onChangeText={(v: string) => setManualAddr({...manualAddr, city: v})}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Pincode</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="e.g. 524001" 
                      keyboardType="numeric"
                      value={manualAddr.pincode}
                      onChangeText={(v: string) => setManualAddr({...manualAddr, pincode: v})}
                    />
                  </View>
                </View>
                {errorMsg && <Text style={styles.manualError}>{errorMsg}</Text>}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.manualBtn} 
              onPress={isManualEntry ? handleManualSave : () => setIsManualEntry(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Plus size={20} color={COLORS.white} />
                  <Text style={styles.manualBtnText}>{isManualEntry ? 'Save & Proceed' : 'Add New Address'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 16,
    marginBottom: 24,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  btnSubtext: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addrIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addrType: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  addrText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  manualForm: {
    gap: 16,
    paddingTop: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  manualError: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  manualBtn: {
    backgroundColor: COLORS.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 10,
    ...SHADOWS.md,
  },
  manualBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
