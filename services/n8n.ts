/**
 * n8n Webhook Integration
 * Calls n8n workflows for RAG-powered tool execution
 */

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
 */
export async function findConversationByParticipant(params: ConversationSearchParams): Promise<string | null> {
  try {
    const { getDocs, collection, query, where } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase/db');
    
    // 1. Get all users to find the user ID by name
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || '' }));
    
    // 2. Find user IDs that match the participant name
    const matchingUserIds = users
      .filter(user => user.name.toLowerCase().includes(params.participantName.toLowerCase()))
      .map(user => user.id);
    
    if (matchingUserIds.length === 0) {
      console.log('[n8n] No users found matching:', params.participantName);
      return null;
    }
    
    console.log('[n8n] Found matching user IDs:', matchingUserIds);
    
    // 3. Get all conversations where the current user is a participant
    const conversationsRef = collection(db, 'conversations');
    const userConversationsQuery = query(
      conversationsRef,
      where('participantIds', 'array-contains', params.userId)
    );
    const conversationsSnapshot = await getDocs(userConversationsQuery);
    
    // 4. Find conversations that also include the matching participant
    const matchingConversations = conversationsSnapshot.docs.filter(doc => {
      const participantIds = doc.data().participantIds || [];
      // Check if any of the matching user IDs are in this conversation
      return matchingUserIds.some(id => participantIds.includes(id));
    });
    
    if (matchingConversations.length === 0) {
      console.log('[n8n] No conversations found with matching participants');
      return null;
    }
    
    // 5. Separate 1-on-1 conversations from group chats
    const oneOnOneConversations = matchingConversations.filter(doc => {
      const participantIds = doc.data().participantIds || [];
      return participantIds.length === 2; // Exactly 2 participants = 1-on-1
    });
    
    const groupChats = matchingConversations.filter(doc => {
      const participantIds = doc.data().participantIds || [];
      return participantIds.length > 2; // More than 2 participants = group chat
    });
    
    // 6. Prefer 1-on-1 conversations, fall back to group chats
    const candidates = oneOnOneConversations.length > 0 ? oneOnOneConversations : groupChats;
    
    console.log('[n8n] Search results:', {
      totalMatches: matchingConversations.length,
      oneOnOnes: oneOnOneConversations.length,
      groupChats: groupChats.length,
      using: oneOnOneConversations.length > 0 ? '1-on-1' : 'group chat'
    });
    
    const conversationId = candidates[0].id;
    console.log('[n8n] Found conversation:', conversationId);
    
    return conversationId;
  } catch (error) {
    console.error('[n8n] Error searching conversations:', error);
    return null;
  }
}

/**
 * Call n8n workflow for conversation summarization
 */
export async function summarizeConversation(params: N8NToolParams): Promise<string> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('n8n webhook URL not configured. Please add EXPO_PUBLIC_N8N_WEBHOOK_URL to your environment variables.');
  }

  // Fetch user's display name
  let userName = 'User';
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase/db');
    const userDoc = await getDoc(doc(db, 'users', params.userId));
    if (userDoc.exists()) {
      userName = userDoc.data().name || 'User';
    }
  } catch (error) {
    console.warn('[n8n] Could not fetch user name:', error);
  }

  // Use the webhook URL as-is (it's the complete endpoint, no need to append path)
  const webhookUrl = N8N_WEBHOOK_URL.endsWith('/') ? N8N_WEBHOOK_URL.slice(0, -1) : N8N_WEBHOOK_URL;
  console.log('[n8n] Calling webhook:', webhookUrl);
  console.log('[n8n] Params:', { ...params, userName });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify({ ...params, userName }),
    });

    console.log('[n8n] Response status:', response.status, response.statusText);
    console.log('[n8n] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[n8n] Error response:', errorData);
      throw new Error(errorData.error?.message || `n8n webhook error: ${response.status}`);
    }

    // Parse JSON response - but first check if body exists
    const responseText = await response.text();
    console.log('[n8n] Raw response length:', responseText.length);
    console.log('[n8n] Raw response preview:', responseText.substring(0, 200));
    
    if (!responseText || responseText.length === 0) {
      throw new Error('n8n returned empty response. Check that Respond to Webhook node has data wired to it.');
    }
    
    const data = JSON.parse(responseText);
    console.log('[n8n] Parsed JSON data:', data);
    
    // Handle array response from n8n
    if (Array.isArray(data) && data.length > 0) {
      const summary = data[0].summary;
      console.log('[n8n] Extracted summary from array:', summary);
      return summary || 'Unable to generate summary';
    }
    
    // Handle object response
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

