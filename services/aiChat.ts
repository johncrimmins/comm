/**
 * AI Chat Service
 * Handles AI-specific conversation logic using existing chat and OpenAI services
 */

import { sendMessage } from './chat';
import { chatWithAI } from './openai';
import { getAISystemPrompt } from './aiPrompts';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

/**
 * AI Message Flow Orchestrator
 * 
 * This function orchestrates the complete AI conversation flow:
 * 1. Store user message in Firestore
 * 2. Fetch conversation history for context
 * 3. Call OpenAI with conversation context and tool support
 * 4. Store AI response back to Firestore
 * 
 * Flow: Firestore → OpenAI → Tool Execution (optional) → Firestore → UI Update
 */
export async function sendAIMessage(
  conversationId: string,
  userMessage: string,
  senderId: string
): Promise<void> {
  // ====================================================================
  // STEP 1: Store user message in Firestore
  // Messages are stored immediately for optimistic UI updates
  // ====================================================================
  await sendMessage(conversationId, userMessage, senderId);

  // ====================================================================
  // STEP 2: Fetch conversation history for context
  // Only fetch last 10 messages (user + AI only) to keep context manageable
  // ====================================================================
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  try {
    console.log('[AI Chat] Fetching conversation history for:', conversationId);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(10));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    console.log('[AI Chat] Found', messagesSnapshot.docs.length, 'messages');
    
    // Filter to only user and AI messages (exclude other participants in group chats)
    const messages = messagesSnapshot.docs
      .map(doc => doc.data())
      .filter(msg => msg.senderId === senderId || msg.senderId === 'ai-assistant')
      .reverse(); // Reverse to get chronological order (oldest first)
    
    console.log('[AI Chat] Filtered to', messages.length, 'messages (user + AI only)');
    
    // Transform to OpenAI format: {role: 'user' | 'assistant', content: string}
    conversationHistory = messages.map(msg => ({
      role: msg.senderId === senderId ? 'user' : 'assistant',
      content: msg.text || ''
    }));
    
    console.log('[AI Chat] Conversation history prepared:', conversationHistory.length, 'messages');
  } catch (error) {
    console.error('[AI Chat] Error fetching conversation history:', error);
    // Continue without history if fetch fails (AI can still respond)
  }

  // ====================================================================
  // STEP 3: Generate AI response with OpenAI
  // Include conversation history, system prompt, and enable tool calling
  // Tools allow AI to interact with external systems (e.g., n8n webhooks)
  // ====================================================================
  try {
    console.log('[AI Chat] Calling OpenAI with:', {
      userMessage: userMessage.substring(0, 50) + '...',
      conversationHistoryLength: conversationHistory.length,
      enableTools: true,
      conversationId: conversationId
    });
    
    const aiResponse = await chatWithAI({
      userMessage: userMessage,
      systemPrompt: getAISystemPrompt('default'),
      conversationHistory: conversationHistory,
      enableTools: true, // Enables tool calling (e.g., conversation summarization)
      currentConversationId: conversationId,
      userId: senderId,
    });
    
    console.log('[AI Chat] Received AI response:', aiResponse.substring(0, 100) + '...');

    // ====================================================================
    // STEP 4: Store AI response in Firestore
    // Response is stored with senderId 'ai-assistant' for proper display
    // ====================================================================
    await sendMessage(conversationId, aiResponse, 'ai-assistant');
  } catch (error) {
    // Graceful fallback: send user-friendly error message if AI fails
    const fallbackMessage = "I'm sorry, I'm having trouble processing that right now. Please try again.";
    await sendMessage(conversationId, fallbackMessage, 'ai-assistant');
  }
}

/**
 * Check if a conversation is an AI conversation
 */
export function isAIConversation(participantIds: string[]): boolean {
  return participantIds.includes('ai-assistant');
}

