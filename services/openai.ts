/**
 * OpenAI API integration for text transformations
 */

import { summarizeConversation, findConversationByParticipant } from './n8n';

const getEnv = (key: string): string => {
  const value = process.env[key as keyof NodeJS.ProcessEnv];
  if (!value) {
    console.warn(`[OpenAI] Missing environment variable: ${key}`);
    return '';
  }
  return String(value);
};

const OPENAI_API_KEY = getEnv('EXPO_PUBLIC_OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface TransformOptions {
  text: string;
  systemPrompt: string;
}

export interface ChatOptions {
  userMessage: string;
  systemPrompt: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  enableTools?: boolean;
  currentConversationId?: string;
  userId?: string;
}

/**
 * Generic function to transform text using OpenAI API with a custom system prompt
 */
export async function transformText(options: TransformOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.');
  }

  if (!options.text.trim()) {
    throw new Error('Text cannot be empty');
  }

  if (!options.systemPrompt.trim()) {
    throw new Error('System prompt cannot be empty');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: options.systemPrompt
          },
          {
            role: 'user',
            content: `Transform this message:\n\n${options.text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const transformedText = data.choices?.[0]?.message?.content?.trim();

    if (!transformedText) {
      throw new Error('No transformed text returned from OpenAI');
    }

    return transformedText;
  } catch (error: any) {
    console.error('[OpenAI] Error transforming text:', error);
    throw error;
  }
}

/**
 * Chat with AI assistant using OpenAI API
 * Designed for conversational AI chat (not text transformations)
 * Supports tool calling for advanced features like conversation summarization
 */
export async function chatWithAI(options: ChatOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.');
  }

  if (!options.userMessage.trim()) {
    throw new Error('User message cannot be empty');
  }

  if (!options.systemPrompt.trim()) {
    throw new Error('System prompt cannot be empty');
  }

  try {
    // Build messages array with conversation history if provided
    const messages: any[] = [
      {
        role: 'system',
        content: options.systemPrompt
      }
    ];

    // Add conversation history if provided
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      messages.push(...options.conversationHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: options.userMessage
    });

    // Define tools if enabled
    const tools = options.enableTools ? [
      {
        type: 'function',
        function: {
          name: 'summarize_conversation',
          description: 'Summarize a conversation thread. Can use conversation ID directly or search by participant name.',
          parameters: {
            type: 'object',
            properties: {
              conversationId: {
                type: 'string',
                description: 'The ID of the conversation to summarize. Leave empty if using participantName to search.'
              },
              participantName: {
                type: 'string',
                description: 'Name of a participant in the conversation. Use this if the user mentions someone by name instead of a conversation ID.'
              }
            },
            required: []
          }
        }
      }
    ] : undefined;

    // First API call
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: tools ? 'auto' : undefined,
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    console.log('[OpenAI] Initial response:', {
      hasToolCalls: !!message.tool_calls,
      toolCallsCount: message.tool_calls?.length || 0,
      content: message.content
    });

    // ====================================================================
    // TOOL CALLING FLOW
    // OpenAI detected keywords and wants to call a tool (e.g., summarize_conversation)
    // ====================================================================
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('[OpenAI] Tool calls detected:', message.tool_calls);
      
      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        message.tool_calls.map(async (toolCall: any) => {
          console.log('[OpenAI] Executing tool call:', toolCall.function.name);
          
          // Handle summarize_conversation tool
          if (toolCall.function.name === 'summarize_conversation') {
            const params = JSON.parse(toolCall.function.arguments);
            console.log('[OpenAI] summarize_conversation params:', params);
            
            let conversationId = params.conversationId;
            
            // CONVERSATION ID RESOLUTION FLOW:
            // 1. Try conversationId parameter (if provided)
            // 2. Search by participantName (if provided)
            // 3. Fall back to current conversation
            
            // Step 2: Search by participant name if no conversationId
            if (!conversationId && params.participantName) {
              console.log('[OpenAI] Searching for conversation with participant:', params.participantName);
              const foundId = await findConversationByParticipant({
                userId: options.userId || '',
                participantName: params.participantName
              });
              
              if (!foundId) {
                // Return error message if not found
                return {
                  tool_call_id: toolCall.id,
                  role: 'tool',
                  name: 'summarize_conversation',
                  content: JSON.stringify({ 
                    summary: `I couldn't find a conversation with ${params.participantName}. Please try again with a different name or conversation ID.`
                  })
                };
              }
              
              conversationId = foundId;
              console.log('[OpenAI] Found conversation:', conversationId);
            }
            
            // Step 3: Fallback to current conversation if still no ID
            if (!conversationId) {
              conversationId = options.currentConversationId || '';
              console.log('[OpenAI] Using current conversation:', conversationId);
            }
            
            // Call n8n webhook to get summary from RAG pipeline
            const summaryResponse = await summarizeConversation({
              conversationId: conversationId,
              userId: options.userId || ''
            });
            
            // n8n returns a plain summary string (extracted from array format)
            const summary = summaryResponse;
            const currentUserId = options.userId || '';
            
            console.log('[OpenAI] Received summary from n8n, length:', summary.length);
            
            // PERSONALIZATION FLOW:
            // 1. Fetch all user names from Firebase
            // 2. Replace user IDs with names in summary
            // 3. Replace current user's name with "You"
            
            // Step 1: Fetch participant names for personalization
            let participantNames: Record<string, string> = {};
            try {
              const { getDocs, collection } = await import('firebase/firestore');
              const { db } = await import('@/lib/firebase/db');
              const usersRef = collection(db, 'users');
              const usersSnapshot = await getDocs(usersRef);
              usersSnapshot.docs.forEach(doc => {
                participantNames[doc.id] = doc.data().name || '';
              });
              console.log('[OpenAI] Loaded participant names:', Object.keys(participantNames).length, 'users');
            } catch (error) {
              console.warn('[OpenAI] Could not fetch participant names:', error);
            }
            
            // Step 2 & 3: Personalize the summary
            let personalizedSummary = summary;
            const currentUserName = currentUserId ? participantNames[currentUserId] : '';
            
            // Step 1: Replace IDs with names first
            Object.keys(participantNames).forEach(userId => {
              const name = participantNames[userId];
              const idRegex = new RegExp(userId, 'g');
              personalizedSummary = personalizedSummary.replace(idRegex, name);
            });
            
            // Step 2: Replace common patterns involving the current user with "You"
            if (currentUserName) {
              // Escape special regex characters in the name
              const escapedName = currentUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              
              // Pattern: "user {name}" → "You"
              // Pattern: "{name} stated" → "You stated"
              // Pattern: "from {name}" → "from You"
              const userPatterns = [
                new RegExp(`user\\s+${escapedName}`, 'gi'),
                new RegExp(`from\\s+user\\s+${escapedName}`, 'gi'),
                new RegExp(`${escapedName}\\s+stated`, 'gi'),
                new RegExp(`${escapedName}\\s+said`, 'gi'),
                new RegExp(`message\\s+from\\s+${escapedName}`, 'gi'),
                new RegExp(`single\\s+message\\s+from\\s+user\\s+${escapedName}`, 'gi'),
              ];
              
              userPatterns.forEach(pattern => {
                personalizedSummary = personalizedSummary.replace(pattern, 'You');
              });
            }
            
            // Step 3: Replace remaining instances of current user's name with "You"
            if (currentUserName) {
              const currentUserNameRegex = new RegExp(`\\b${currentUserName}\\b`, 'gi');
              personalizedSummary = personalizedSummary.replace(currentUserNameRegex, 'You');
            }
            
            console.log('[OpenAI] Personalized summary:', personalizedSummary.substring(0, 100) + '...');
            
            return {
              tool_call_id: toolCall.id,
              role: 'tool',
              name: 'summarize_conversation',
              content: JSON.stringify({ summary: personalizedSummary })
            };
          }
          return null;
        })
      );

      // Filter out null results
      const validToolResults = toolResults.filter(result => result !== null);

      // Send tool results back to OpenAI for final response
      const finalResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            ...messages,
            message, // Original tool call request
            ...validToolResults, // Tool results
            { role: 'user', content: 'Please provide a concise summary of this conversation in under 200 words.' }
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
      });

      if (!finalResponse.ok) {
        const errorData = await finalResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API error: ${finalResponse.status}`);
      }

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices?.[0]?.message?.content?.trim();

      console.log('[OpenAI] Final response after tool execution:', finalMessage?.substring(0, 100) + '...');

      if (!finalMessage) {
        throw new Error('No response returned from OpenAI');
      }

      return finalMessage;
    }

    // No tool calls, return direct response
    console.log('[OpenAI] No tool calls, returning direct response');
    const aiResponse = message.content?.trim();

    if (!aiResponse) {
      throw new Error('No response returned from OpenAI');
    }

    return aiResponse;
  } catch (error: any) {
    console.error('[OpenAI] Error chatting with AI:', error);
    throw error;
  }
}

