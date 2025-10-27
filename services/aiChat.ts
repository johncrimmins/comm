/**
 * AI Chat Service
 * Handles AI-specific conversation logic using existing chat and OpenAI services
 */

import { sendMessage } from './chat';
import { chatWithAI } from './openai';
import { getAISystemPrompt } from './aiPrompts';

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

  // 2. Generate AI response using OpenAI
  try {
    const aiResponse = await chatWithAI({
      userMessage: userMessage,
      systemPrompt: getAISystemPrompt('default'),
    });

    // 3. Store AI response as a message from the AI assistant
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

