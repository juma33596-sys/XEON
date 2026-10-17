import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  url: string;
  provider: 'imgbb' | 'firebase_storage' | 'data_url';
  fileName: string;
}

export const DEFAULT_IMGBB_API_KEY = '027e901693380c0de7d21938fdc8dd70';

export function getStoredImgbbKey(): string {
  if (typeof window === 'undefined') return DEFAULT_IMGBB_API_KEY;
  return (
    localStorage.getItem('nexora_imgbb_key') ||
    (import.meta.env.VITE_IMGBB_API_KEY as string) ||
    DEFAULT_IMGBB_API_KEY
  );
}

export function setStoredImgbbKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('nexora_imgbb_key', key.trim());
    } else {
      localStorage.removeItem('nexora_imgbb_key');
    }
  }
}

/**
 * Upload an image file with multi-stage fallback:
 * 1. Direct ImgBB API upload (if key configured or proxy present)
 * 2. Firebase Storage upload
 * 3. Base64 Data URL fallback
 */
export async function uploadImageFile(
  file: File,
  onProgress?: (percent: number) => void,
  explicitApiKey?: string
): Promise<UploadResult> {
  // 1. Validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file format: ${file.type}. Allowed: JPEG, PNG, WebP, GIF.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum 10MB limit.`);
  }

  if (onProgress) onProgress(15);

  const imgbbKey =
    (explicitApiKey && explicitApiKey.trim()) ||
    getStoredImgbbKey() ||
    DEFAULT_IMGBB_API_KEY;

  // 2. Direct ImgBB Upload if API key is present
  if (imgbbKey) {
    try {
      if (onProgress) onProgress(35);
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbKey)}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.url) {
          if (onProgress) onProgress(100);
          return {
            url: json.data.display_url || json.data.url,
            provider: 'imgbb',
            fileName: file.name,
          };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('ImgBB API returned non-OK status:', errJson);
      }
    } catch (imgbbErr) {
      console.warn('Direct ImgBB upload failed, trying next provider:', imgbbErr);
    }
  }

  // 3. Try server-side ImgBB proxy endpoint if available
  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        if (onProgress) onProgress(100);
        return {
          url: data.url,
          provider: 'imgbb',
          fileName: file.name,
        };
      }
    }
  } catch {
    // proceed to Firebase Storage
  }

  if (onProgress) onProgress(60);

  // 4. Firebase Storage Integration
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `products/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    if (onProgress) onProgress(85);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    if (onProgress) onProgress(100);

    return {
      url: downloadUrl,
      provider: 'firebase_storage',
      fileName: file.name,
    };
  } catch (storageErr: any) {
    console.warn('Firebase storage upload failed or not enabled:', storageErr);
  }

  if (onProgress) onProgress(90);

  // 5. Fallback: Data URL for instant preview & persistent offline testing
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve({
        url: reader.result as string,
        provider: 'data_url',
        fileName: file.name,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file data.'));
    reader.readAsDataURL(file);
  });
}
