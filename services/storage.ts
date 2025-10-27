/**
 * Firebase Storage Service
 * Handles image uploads to Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/app';
import * as FileSystem from 'expo-file-system';

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const raw = atob(base64);
  const rawLength = raw.length;
  const array = new Uint8Array(new ArrayBuffer(rawLength));
  
  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  
  return array;
}

/**
 * Upload image to Firebase Storage
 * @param uri - Local image URI from expo-image-picker
 * @param conversationId - Conversation ID for organizing files
 * @param messageId - Message ID to use as filename
 * @returns Download URL of uploaded image
 */
export async function uploadImage(
  uri: string,
  conversationId: string,
  messageId: string
): Promise<string> {
  console.log('[Storage] Starting image upload', { uri, conversationId, messageId });
  try {
    // Read file as base64 using expo-file-system
    console.log('[Storage] Reading file as base64');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('[Storage] File read, base64 length:', base64.length);
    
    // Convert base64 to Uint8Array
    const bytes = base64ToUint8Array(base64);
    console.log('[Storage] Converted to Uint8Array, size:', bytes.length);
    
    // Create storage reference
    const storageRef = ref(storage, `conversations/${conversationId}/images/${messageId}.jpg`);
    console.log('[Storage] Uploading to:', `conversations/${conversationId}/images/${messageId}.jpg`);
    
    // Upload the bytes
    await uploadBytes(storageRef, bytes);
    console.log('[Storage] Upload completed');
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[Storage] Download URL:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('[Storage] Failed to upload image:', error);
    throw new Error('Failed to upload image');
  }
}

