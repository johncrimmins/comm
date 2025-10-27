/**
 * n8n Webhook Integration
 * Calls n8n workflows for RAG-powered tool execution
 */

import { findConversationByParticipantName, filterUserConversations, categorizeConversations } from '@/utils/conversationHelpers';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

const getEnv = (key: string): string => {
  const value = process.env[key as keyof NodeJS.ProcessEnv];
  if (!value) {
    console.warn(`[n8n] Missing environment variable: ${key}`);
    return '';
  }
  return String(value);
};

const N8N_WEBHOOK_URL = getEnv('EXPO_PUBLIC_N8N_WEBHOOK_URL');
console.log('[n8n] Environment variable loaded:', N8N_WEBHOOK_URL ? '✅ Yes' : '❌ No');

export interface N8NToolParams {
  conversationId: string;
  userId: string;
}

export interface ConversationSearchParams {
  userId: string;
  participantName: string;
}

/**
 * Search for conversations by participant name
 * Returns the conversationId of the first matching conversation
 * 
 * Uses extracted utility functions from utils/conversationHelpers.ts
 */
export async function findConversationByParticipant(params: ConversationSearchParams): Promise<string | null> {
  try {
    // 1. Get all users to find the user ID by name
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || '' }));
    
    // 2. Get all conversations where the current user is a participant
    const conversationsRef = collection(db, 'conversations');
    const userConversationsQuery = query(
      conversationsRef,
      where('participantIds', 'array-contains', params.userId)
    );
    const conversationsSnapshot = await getDocs(userConversationsQuery);
    
    // 3. Transform to format expected by utility function
    const conversations = conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      participantIds: doc.data().participantIds || []
    }));
    
    // 4. Use extracted utility function to find conversation
    const conversationId = findConversationByParticipantName(
      conversations,
      users,
      params.userId,
      params.participantName
    );
    
    if (conversationId) {
      console.log('[n8n] Found conversation:', conversationId);
    } else {
      console.log('[n8n] No conversation found with participant:', params.participantName);
    }
    
    return conversationId;
  } catch (error) {
    console.error('[n8n] Error searching conversations:', error);
    return null;
  }
}

/**
 * n8n Webhook Integration for RAG Pipeline
 * 
 * Calls n8n workflow that:
 * 1. Fetches messages from Firebase
 * 2. Sends to OpenAI for summarization
 * 3. Returns summary back to client
 * 
 * Response format: [{summary: "..."}] (array format from n8n)
 */
export async function summarizeConversation(params: N8NToolParams): Promise<string> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('n8n webhook URL not configured. Please add EXPO_PUBLIC_N8N_WEBHOOK_URL to your environment variables.');
  }

  // Normalize webhook URL (remove trailing slash if present)
  const webhookUrl = N8N_WEBHOOK_URL.endsWith('/') ? N8N_WEBHOOK_URL.slice(0, -1) : N8N_WEBHOOK_URL;
  console.log('[n8n] Calling webhook:', webhookUrl);
  console.log('[n8n] Params:', params);

  try {
    // Send POST request to n8n webhook
    // Note: No Content-Type header to avoid CORS preflight OPTIONS request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    console.log('[n8n] Response status:', response.status, response.statusText);
    console.log('[n8n] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[n8n] Error response:', errorData);
      throw new Error(errorData.error?.message || `n8n webhook error: ${response.status}`);
    }

    // Parse response (n8n returns array format)
    const responseText = await response.text();
    console.log('[n8n] Raw response length:', responseText.length);
    console.log('[n8n] Raw response preview:', responseText.substring(0, 200));
    
    if (!responseText || responseText.length === 0) {
      throw new Error('n8n returned empty response. Check that Respond to Webhook node has data wired to it.');
    }
    
    const data = JSON.parse(responseText);
    console.log('[n8n] Parsed JSON data:', data);
    
    // EXTRACT SUMMARY FROM RESPONSE
    // n8n typically returns array format: [{summary: "..."}]
    if (Array.isArray(data) && data.length > 0) {
      const summary = data[0].summary;
      console.log('[n8n] Extracted summary from array:', summary);
      return summary || 'Unable to generate summary';
    }
    
    // Fallback: handle object response format (if n8n returns object directly)
    if (data.summary) {
      return data.summary;
    }
    
    console.error('[n8n] Unexpected response format:', data);
    return 'Unable to generate summary';
  } catch (error: any) {
    console.error('[n8n] Error calling summarize workflow:', error);
    throw error;
  }
}

