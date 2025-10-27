/**
 * Firebase Storage Service
 * Handles image uploads to Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/app';

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
  try {
    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Create storage reference
    const storageRef = ref(storage, `conversations/${conversationId}/images/${messageId}.jpg`);
    
    // Upload the blob
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    throw new Error('Failed to upload image');
  }
}

