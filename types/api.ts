/**
 * Type definitions for external API responses
 * These types improve type safety without changing runtime behavior
 */

/**
 * OpenAI API Response Types
 */
export interface OpenAIChoice {
  message: OpenAIMessage;
  finish_reason: string;
  index: number;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
}

export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string that needs to be parsed
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Tool Result Types (for tool calling)
 */
export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string; // JSON string
}

/**
 * n8n Webhook Response Types
 */
export interface N8NResponseItem {
  summary: string;
  userName?: string;
}

export type N8NResponse = N8NResponseItem[] | N8NResponseItem;

/**
 * Tool Parameter Types
 */
export interface SummarizeConversationParams {
  conversationId?: string;
  participantName?: string;
}

/**
 * OpenAI Chat Message Types
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Conversation History Format
 */
export interface ConversationHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * User Search Result
 */
export interface UserSearchResult {
  id: string;
  name: string;
}

