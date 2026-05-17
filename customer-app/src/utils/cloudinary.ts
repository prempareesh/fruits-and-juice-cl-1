import axios from 'axios';
import { Platform } from 'react-native';

/**
 * PRODUCTION-GRADE CLOUDINARY UPLOAD UTILITY
 * Handles unsigned uploads to Cloudinary with deep debugging and robust error handling.
 */

// Supporting Expo Public prefixes for environment variables
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dftmg2l2m';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const uploadToCloudinary = async (
  file: any, // Can be URI (string) or Web File object
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    const formData = new FormData();
    
    if (typeof file === 'string') {
      const isBase64 = file.startsWith('data:');
      if (isBase64) {
        formData.append('file', file);
      } else if (Platform.OS === 'web') {
        // On web, if it's a URL/URI that's not base64, we might need to fetch it
        // but usually ImagePicker returns base64 or a Blob.
        formData.append('file', file);
      } else {
        // Native
        const filename = file.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('file', {
          uri: file,
          name: filename,
          type,
        } as any);
      }
    } else {
      // It's a Web File/Blob object
      formData.append('file', file);
    }
    
    formData.append('upload_preset', UPLOAD_PRESET);

    console.log('[CLOUDINARY] Uploading to:', CLOUDINARY_URL);
    
    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    if (response.data && response.data.secure_url) {
      return response.data.secure_url;
    }
    throw new Error('No secure_url in response');

  } catch (error: any) {
    console.error('[CLOUDINARY_ERROR]', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};
