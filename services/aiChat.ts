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
 * Send a message in an AI conversation
 * Stores user message and generates AI response
 */
export async function sendAIMessage(
  conversationId: string,
  userMessage: string,
  senderId: string
): Promise<void> {
  // 1. Store user message using existing chat service
  await sendMessage(conversationId, userMessage, senderId);

  // 2. Fetch conversation history (only conversations user is part of)
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  try {
    console.log('[AI Chat] Fetching conversation history for:', conversationId);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(10));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    console.log('[AI Chat] Found', messagesSnapshot.docs.length, 'messages');
    
    // Transform messages to OpenAI format, filtering to only user's conversations
    const messages = messagesSnapshot.docs
      .map(doc => doc.data())
      .filter(msg => msg.senderId === senderId || msg.senderId === 'ai-assistant')
      .reverse(); // Reverse to get chronological order
    
    console.log('[AI Chat] Filtered to', messages.length, 'messages (user + AI only)');
    
    conversationHistory = messages.map(msg => ({
      role: msg.senderId === senderId ? 'user' : 'assistant',
      content: msg.text || ''
    }));
    
    console.log('[AI Chat] Conversation history prepared:', conversationHistory.length, 'messages');
  } catch (error) {
    console.error('[AI Chat] Error fetching conversation history:', error);
    // Continue without history if fetch fails
  }

  // 3. Generate AI response using OpenAI with tools enabled
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
      enableTools: true,
      currentConversationId: conversationId,
      userId: senderId,
    });
    
    console.log('[AI Chat] Received AI response:', aiResponse.substring(0, 100) + '...');

    // 4. Store AI response as a message from the AI assistant
    await sendMessage(conversationId, aiResponse, 'ai-assistant');
  } catch (error) {
    // If AI fails, send a fallback message
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

