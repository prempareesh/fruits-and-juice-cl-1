import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { X, Upload, FileJson, FileText, CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../../lib/supabase';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface BulkUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkUploadModal = ({ visible, onClose, onSuccess }: BulkUploadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setLoading(true);
      setResults(null);

      let content = '';
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        content = await response.text();
      } else {
        content = await FileSystem.readAsStringAsync(file.uri);
      }

      let productsToUpload: any[] = [];
      if (file.name.endsWith('.json')) {
        productsToUpload = JSON.parse(content);
      } else if (file.name.endsWith('.csv')) {
        productsToUpload = parseCSV(content);
      }

      await uploadProducts(productsToUpload);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to read or parse file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, i) => {
        let val: any = values[i]?.trim();
        if (header === 'price' || header === 'original_price' || header === 'discount_percent' || header === 'stock') {
          val = parseFloat(val) || 0;
        } else if (header === 'is_featured' || header === 'is_trending') {
          val = val?.toLowerCase() === 'true';
        }
        obj[header] = val;
      });
      return obj;
    });
  };

  const uploadProducts = async (products: any[]) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Chunk uploads to avoid payload size limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE).map(p => ({
        ...p,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('products').insert(chunk);
      
      if (error) {
        failedCount += chunk.length;
        errors.push(`Chunk ${Math.floor(i/CHUNK_SIZE) + 1}: ${error.message}`);
      } else {
        successCount += chunk.length;
      }
    }

    setResults({ success: successCount, failed: failedCount, errors });
    if (successCount > 0) onSuccess();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={FadeInUp.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Bulk Upload</Text>
              <Text style={styles.modalSubtitle}>Import products via CSV or JSON</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {!results ? (
              <Animated.View entering={FadeInDown} style={styles.uploadArea}>
                <View style={styles.iconCircle}>
                  <Upload size={32} color="#10b981" />
                </View>
                <Text style={styles.uploadTitle}>Select your file</Text>
                <Text style={styles.uploadDesc}>Supported formats: .csv, .json</Text>
                
                <View style={styles.formatInfo}>
                  <Info size={16} color="#64748b" />
                  <Text style={styles.formatText}>Headers: name, category, price, stock, image_url, quantity, description</Text>
                </View>

                <TouchableOpacity 
                  style={styles.pickBtn} 
                  onPress={handlePickFile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <FileText size={20} color="#fff" />
                      <Text style={styles.pickBtnText}>Choose File</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown} style={styles.resultArea}>
                <CheckCircle2 size={48} color="#10b981" />
                <Text style={styles.resultTitle}>Upload Complete</Text>
                
                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={[styles.statNum, { color: '#10b981' }]}>{results.success}</Text>
                    <Text style={styles.statLabel}>Success</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: '#fef2f2' }]}>
                    <Text style={[styles.statNum, { color: '#ef4444' }]}>{results.failed}</Text>
                    <Text style={styles.statLabel}>Failed</Text>
                  </View>
                </View>

                {results.errors.length > 0 && (
                  <View style={styles.errorBox}>
                    <View style={styles.errorHeader}>
                      <AlertCircle size={16} color="#ef4444" />
                      <Text style={styles.errorTitle}>Errors encountered:</Text>
                    </View>
                    {results.errors.map((err, i) => (
                      <Text key={i} style={styles.errorText}>• {err}</Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                  <Text style={styles.doneBtnText}>Close</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { flexGrow: 0 },
  uploadArea: { alignItems: 'center', paddingVertical: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  uploadDesc: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 24 },
  formatInfo: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 8, marginBottom: 24, width: '100%' },
  formatText: { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, gap: 10, width: '100%', justifyContent: 'center' },
  pickBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultArea: { alignItems: 'center', paddingVertical: 20 },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 16, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 16, width: '100%', marginBottom: 24 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 4 },
  errorBox: { width: '100%', backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, marginBottom: 24 },
  errorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  errorTitle: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
  errorText: { fontSize: 12, color: '#b91c1c', marginBottom: 4 },
  doneBtn: { backgroundColor: '#1e293b', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
