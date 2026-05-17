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
import { X, Camera, Tag, Link2, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { supabase } from '../../../lib/supabase';

interface AdminCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any;
}

export const AdminCategoryModal = ({ visible, onClose, onSuccess, category }: AdminCategoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image_url: '',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        image_url: category.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        image_url: '',
      });
    }
  }, [category, visible]);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    setUploading(true);
    const url = await uploadToCloudinary(uri);
    if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Required', 'Category name is required.');
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setLoading(true);
    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, '-');
      const payload = {
        name: formData.name,
        slug: slug,
        image_url: formData.image_url,
      };

      if (category) {
        const { error } = await supabase.from('categories').update(payload).eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={FadeInUp.springify().damping(15)}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{category ? 'Edit Category' : 'New Category'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Animated.View entering={FadeInDown.delay(100)}>
              <TouchableOpacity style={styles.imageBox} onPress={pickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#10b981" />
              ) : formData.image_url ? (
                <Image source={{ uri: formData.image_url }} style={styles.previewImage} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Camera size={32} color="#94a3b8" />
                  <Text style={styles.uploadText}>Upload Cover Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category Name</Text>
              <View style={styles.inputBox}>
                <Tag size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input} 
                  value={formData.name} 
                  onChangeText={(val) => setFormData(p => ({ ...p, name: val }))}
                  placeholder="e.g. Cold Pressed Juices"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Slug (URL identifier)</Text>
              <View style={styles.inputBox}>
                <Link2 size={18} color="#94a3b8" />
                <TextInput 
                  style={styles.input} 
                  value={formData.slug} 
                  onChangeText={(val) => setFormData(p => ({ ...p, slug: val }))}
                  placeholder="e.g. cold-pressed-juices"
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.btnTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextPrimary}>Save Category</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '70%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  form: { flex: 1 },
  imageBox: { width: '100%', height: 160, backgroundColor: '#f8fafc', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 24 },
  previewImage: { width: '100%', height: '100%' },
  uploadText: { fontSize: 14, color: '#94a3b8', marginTop: 8, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 12, fontSize: 15 },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 16 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  submitBtn: { flex: 2, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' },
  btnTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnTextSecondary: { color: '#64748b', fontWeight: '700', fontSize: 16 }
});
