import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { X, Camera, Plus, Trash2, Package, Tag, Layers, DollarSign, Database, Star, TrendingUp, ChevronDown, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { AdminProductService } from '../../services/AdminProductService';

interface AdminProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any;
}

const CATEGORIES = ['Fruits', 'Vegetables', 'Juices', 'Others'] as const;

export const AdminProductModal = ({ visible, onClose, onSuccess, product }: AdminProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Fruits' as typeof CATEGORIES[number],
    price: '',
    original_price: '',
    stock: '',
    quantity: '',
    image_url: '',
    is_featured: false,
    is_trending: false,
    classic_price: '',
    pure_price: ''
  });

  useEffect(() => {
    if (visible) {
      if (product) {
        setFormData({
          name: product.name || '',
          description: product.description || '',
          category: (product.category as any) || 'Fruits',
          price: String(product.price || ''),
          original_price: String(product.original_price || ''),
          stock: String(product.stock || ''),
          quantity: product.quantity || '',
          image_url: product.image_url || '',
          is_featured: !!product.is_featured,
          is_trending: !!product.is_trending,
          classic_price: product.classic_price ? String(product.classic_price) : '',
          pure_price: product.pure_price ? String(product.pure_price) : ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          category: 'Fruits',
          price: '',
          original_price: '',
          stock: '',
          quantity: '1 kg',
          image_url: '',
          is_featured: false,
          is_trending: false,
          classic_price: '',
          pure_price: ''
        });
      }
    }
  }, [product, visible]);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      // Trigger hidden file input on Web
      const input = document.getElementById('admin-image-input');
      input?.click();
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll access to upload product images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      await processImageUpload(result.assets[0].uri);
    }
  };

  const processImageUpload = async (file: any) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setFormData(prev => ({ ...prev, image_url: url }));
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err: any) {
      console.error('[MODAL] Image Upload Failed:', err);
      Alert.alert('Upload Failed', err.message || 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  // Web Drag & Drop Handlers
  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await processImageUpload(file);
    }
  };

  const handleWebFileChange = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      await processImageUpload(file);
    }
  };

  const handleSubmit = async () => {
    try {
      // 1. Validation
      if (!formData.name.trim()) {
        Alert.alert('Validation Error', 'Product Name is required.');
        return;
      }
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        Alert.alert('Validation Error', 'Valid Selling Price is required.');
        return;
      }
      if (!formData.category) {
        Alert.alert('Validation Error', 'Category is required.');
        return;
      }

      setLoading(true);
      console.log('[ADMIN_MODAL] Submitting product...', { name: formData.name });

      const priceVal = parseFloat(formData.price);
      const originalPriceVal = formData.original_price ? parseFloat(formData.original_price) : priceVal;
      const stockVal = parseInt(formData.stock) || 0;
      
      // Calculate discount
      const discount = originalPriceVal > priceVal 
        ? Math.round(((originalPriceVal - priceVal) / originalPriceVal) * 100) 
        : 0;

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: priceVal,
        original_price: originalPriceVal,
        discount_percent: discount,
        stock: stockVal,
        quantity: formData.quantity.trim() || '1 Unit',
        image_url: formData.image_url,
        is_featured: formData.is_featured,
        is_trending: formData.is_trending,
        updated_at: new Date().toISOString()
      };

      if (formData.category === 'Juices') {
        payload.classic_price = priceVal; // Always equal to Selling Price!
        payload.pure_price = formData.pure_price ? parseFloat(formData.pure_price) : null;
      } else {
        payload.classic_price = null;
        payload.pure_price = null;
      }

      console.log('[ADMIN_MODAL] Final Payload:', payload);

      let result;
      try {
        if (product?.id) {
          console.log('[ADMIN_MODAL] Updating existing product:', product.id);
          result = await AdminProductService.updateProduct(product.id, payload);
        } else {
          console.log('[ADMIN_MODAL] Creating new product...');
          result = await AdminProductService.createProduct(payload);
        }
      } catch (err: any) {
        const errorMsg = err.message || '';
        if (errorMsg.includes('classic_price') || errorMsg.includes('pure_price') || errorMsg.includes('PGRST204')) {
          console.warn('[ADMIN_MODAL] Database columns missing. Stripping variant pricing fields and retrying...');
          const fallbackPayload = { ...payload };
          delete fallbackPayload.classic_price;
          delete fallbackPayload.pure_price;

          if (product?.id) {
            console.log('[ADMIN_MODAL] Updating existing product (fallback):', product.id);
            result = await AdminProductService.updateProduct(product.id, fallbackPayload);
          } else {
            console.log('[ADMIN_MODAL] Creating new product (fallback)...');
            result = await AdminProductService.createProduct(fallbackPayload);
          }
        } else {
          throw err;
        }
      }

      console.log('[ADMIN_MODAL] Success!', result);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('[ADMIN_MODAL_ERROR]', err);
      const errorMsg = err.message || 'Something went wrong while saving the product.';
      
      if (errorMsg.includes('403')) {
        Alert.alert('Permission Denied', 'You do not have permission to modify products. Check your RLS policies.');
      } else {
        Alert.alert('Submission Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp} style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{product ? 'Edit Product' : 'Add New Product'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Image Section */}
            {Platform.OS === 'web' && (
              <input 
                id="admin-image-input"
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleWebFileChange}
              />
            )}
            <TouchableOpacity 
              style={[
                styles.imagePicker, 
                isDragging && styles.imagePickerDragging,
                uploading && styles.imagePickerDisabled
              ]} 
              onPress={handlePickImage} 
              disabled={uploading}
              // @ts-ignore - Web only props
              onDragOver={Platform.OS === 'web' ? handleDragOver : undefined}
              onDragLeave={Platform.OS === 'web' ? handleDragLeave : undefined}
              onDrop={Platform.OS === 'web' ? handleDrop : undefined}
            >
              {uploading ? (
                <View style={styles.uploadingState}>
                  <ActivityIndicator color="#10b981" />
                  <Text style={styles.uploadingText}>Uploading to Cloud...</Text>
                </View>
              ) : formData.image_url ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: formData.image_url }} style={styles.previewImage} />
                  <View style={styles.changeOverlay}>
                    <Camera size={20} color="#fff" />
                    <Text style={styles.changeText}>Change Image</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Upload size={32} color={isDragging ? "#10b981" : "#94a3b8"} />
                  <Text style={[styles.imageLabel, isDragging && { color: '#10b981' }]}>
                    {isDragging ? 'Drop Image Here' : 'Click or Drag Image Here'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <View style={styles.inputBox}>
                <Package size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. Fresh Mangoes"
                  value={formData.name}
                  onChangeText={v => setFormData(p => ({ ...p, name: v }))}
                />
              </View>
            </View>

            <View style={styles.categorySection}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[
                      styles.categoryPill, 
                      formData.category === cat && styles.categoryPillActive
                    ]}
                    onPress={() => {
                      let qty = formData.quantity;
                      if (cat === 'Fruits' || cat === 'Vegetables') qty = '1 kg';
                      if (cat === 'Juices') qty = '300 ml';
                      setFormData(p => ({ ...p, category: cat, quantity: qty }));
                    }}
                  >
                    <Tag size={16} color={formData.category === cat ? '#fff' : '#64748b'} />
                    <Text style={[
                      styles.categoryPillText, 
                      formData.category === cat && styles.categoryPillTextActive
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Unit / Weight</Text>
                <View style={styles.inputBox}>
                  <Layers size={18} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 1 kg"
                    value={formData.quantity}
                    onChangeText={v => setFormData(p => ({ ...p, quantity: v }))}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Selling Price (₹) *</Text>
                <View style={styles.inputBox}>
                  <DollarSign size={18} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={formData.price}
                    onChangeText={v => setFormData(p => ({ ...p, price: v, classic_price: v }))}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>MRP Price (₹)</Text>
                <View style={styles.inputBox}>
                  <DollarSign size={18} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={formData.original_price}
                    onChangeText={v => setFormData(p => ({ ...p, original_price: v }))}
                  />
                </View>
              </View>
            </View>

            {formData.category === 'Juices' && (
              <Animated.View entering={FadeInDown} style={{ marginBottom: 20 }}>
                <Text style={[styles.label, { color: '#10b981', marginTop: 10, fontSize: 15 }]}>JUICE VARIANTS</Text>
                
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Classic Price (₹)</Text>
                    <View style={[styles.inputBox, { backgroundColor: '#f1f5f9' }]}>
                      <DollarSign size={18} color="#94a3b8" />
                      <TextInput 
                        style={[styles.input, { color: '#64748b' }]} 
                        placeholder="Classic Price"
                        keyboardType="numeric"
                        value={formData.price}
                        editable={false}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.label}>Pure Price (₹)</Text>
                    <View style={styles.inputBox}>
                      <DollarSign size={18} color="#94a3b8" />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Pure Price"
                        keyboardType="numeric"
                        value={formData.pure_price}
                        onChangeText={v => setFormData(p => ({ ...p, pure_price: v }))}
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Inventory Stock *</Text>
              <View style={styles.inputBox}>
                <Database size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input} 
                  placeholder="Items in stock"
                  keyboardType="numeric"
                  value={formData.stock}
                  onChangeText={v => setFormData(p => ({ ...p, stock: v }))}
                />
              </View>
            </View>

            <View style={styles.toggleRow}>
              <TouchableOpacity 
                style={[styles.toggleBtn, formData.is_featured && styles.toggleBtnActive]}
                onPress={() => setFormData(p => ({ ...p, is_featured: !p.is_featured }))}
              >
                <Star size={18} color={formData.is_featured ? '#fff' : '#64748b'} />
                <Text style={[styles.toggleText, formData.is_featured && styles.toggleTextActive]}>Featured</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, formData.is_trending && styles.toggleBtnActive]}
                onPress={() => setFormData(p => ({ ...p, is_trending: !p.is_trending }))}
              >
                <TrendingUp size={18} color={formData.is_trending ? '#fff' : '#64748b'} />
                <Text style={[styles.toggleText, formData.is_trending && styles.toggleTextActive]}>Trending</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Description</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Details about quality, origin, etc."
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={v => setFormData(p => ({ ...p, description: v }))}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{product ? 'Update' : 'Create'} Product</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '92%', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  closeBtn: { padding: 8 },
  form: { flex: 1 },
  imagePicker: { width: '100%', height: 180, borderRadius: 24, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' },
  imagePickerDragging: { borderColor: '#10b981', backgroundColor: '#ecfdf5', transform: [{ scale: 1.02 }] },
  imagePickerDisabled: { opacity: 0.7, borderStyle: 'solid' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePreviewContainer: { width: '100%', height: '100%', position: 'relative' },
  changeOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  changeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  uploadingState: { alignItems: 'center', gap: 12 },
  uploadingText: { fontSize: 13, fontWeight: '700', color: '#10b981' },
  imagePlaceholder: { alignItems: 'center', gap: 12 },
  imageLabel: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, height: 54, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b' },
  dropdownTextDisplay: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b' },
  categorySection: { marginBottom: 20 },
  categoryScroll: { paddingRight: 20, gap: 10 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  categoryPillActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  categoryPillText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  categoryPillTextActive: { color: '#fff' },
  row: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  toggleBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  toggleTextActive: { color: '#fff' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
  footer: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
  cancelBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  submitBtn: { flex: 2, height: 56, borderRadius: 16, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' }
});
