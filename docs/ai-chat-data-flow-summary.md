# AI Chat Data Flow Summary

## Overview
This document maps the complete data flow for the AI agent chat feature, excluding long-press transformations.

## Architecture

### Key Files and Responsibilities

#### 1. **UI Layer** (`app/chat/[id].tsx`)
- **Purpose**: Main chat screen that renders messages and handles user input
- **Logic**:
  - Detects if conversation is AI conversation via `isAIConversation(participantIds)`
  - Routes messages to either `sendAIMessage()` (AI) or `sendMessage()` (regular chat)
  - Uses `useMessages` hook for real-time message updates
  - Uses `useConversation` hook for conversation metadata

#### 2. **AI Chat Service** (`services/aiChat.ts`)
- **Purpose**: Orchestrates the complete AI conversation flow
- **Flow**:
  1. Store user message in Firestore
  2. Fetch last 10 messages for context (user + AI only)
  3. Call OpenAI with conversation history and tool support
  4. Store AI response back to Firestore
- **Key Function**: `sendAIMessage(conversationId, userMessage, senderId)`

#### 3. **OpenAI Service** (`services/openai.ts`)
- **Purpose**: Handles OpenAI API integration with tool calling support
- **Key Functions**:
  - `chatWithAI()`: Main chat function with conversation history
  - `transformText()`: Text transformation (not used in AI chat)
- **Tool Calling Flow**:
  1. First API call with messages + tools definition
  2. If tool detected, execute tool calls (e.g., `summarize_conversation`)
  3. Personalize responses (replace user IDs with names, "You" for current user)
  4. Second API call with tool results for final response
- **Tools**: Currently supports `summarize_conversation` tool

#### 4. **n8n Service** (`services/n8n.ts`)
- **Purpose**: Calls n8n webhooks for RAG pipeline execution
- **Key Functions**:
  - `summarizeConversation()`: Calls n8n webhook to get conversation summary
  - `findConversationByParticipant()`: Searches conversations by participant name
- **Webhook Flow**:
  1. POST request to n8n webhook URL
  2. n8n fetches messages from Firestore
  3. n8n processes with OpenAI
  4. Returns array format: `[{summary: "..."}]`

#### 5. **Chat Service** (`services/chat.ts`)
- **Purpose**: Core Firestore operations for messages and conversations
- **Key Functions**:
  - `sendMessage()`: Creates message document in Firestore
  - `markDelivered()`: Adds userId to `deliveredTo` array
  - `markRead()`: Adds userId to `readBy` array
  - `createOrFindConversation()`: Creates or finds existing conversation

#### 6. **AI Prompts** (`services/aiPrompts.ts`)
- **Purpose**: Centralized AI system prompt configuration
- **Current Prompt**: Explains Comms AI assistant role, mentions summarize tool

#### 7. **Hooks**
- **`useMessages.ts`**: Real-time listener for messages, calculates status
- **`useConversations.ts`**: Real-time listener for conversations list
- **`useConversation.ts`**: Single conversation data listener

#### 8. **UI Components**
- **`ChatHeader.tsx`**: Displays conversation title and presence
- **`ChatMessages.tsx`**: FlatList for rendering messages
- **`ChatInput.tsx`**: Input component with send functionality
- **`Message.tsx`**: Individual message bubble

## Complete Data Flow

### User Sends Message to AI

```
[User types message in ChatInput]
         ↓
[app/chat/[id].tsx: handleSend()]
         ↓
[Detects isAI = true via isAIConversation()]
         ↓
[services/aiChat.ts: sendAIMessage()]
         ↓
[STEP 1: Store user message]
  services/chat.ts: sendMessage()
  → Firestore: conversations/{id}/messages/{msgId}
  {
    text: "user message",
    senderId: "userId",
    createdAt: timestamp,
    deliveredTo: ["userId"],
    readBy: []
  }
         ↓
[STEP 2: Fetch conversation history]
  Firestore query: last 10 messages (user + AI only)
  → Transform to OpenAI format: [{role: 'user', content: '...'}]
         ↓
[STEP 3: Call OpenAI with context]
  services/openai.ts: chatWithAI()
  → POST to OpenAI API with:
    - systemPrompt (from aiPrompts.ts)
    - conversationHistory (last 10 messages)
    - userMessage
    - tools: [summarize_conversation]
         ↓
[OpenAI checks for keywords: "summary", "summarize", "recap", "review"]
         ↓
[IF tool detected: summarize_conversation]
  ↓ Parse tool parameters: {conversationId OR participantName}
  ↓ IF participantName provided:
     services/n8n.ts: findConversationByParticipant()
     → Query Firestore for conversations
     → Match by participant name
     → Return conversationId
  ↓
  services/n8n.ts: summarizeConversation()
  → POST to n8n webhook: {conversationId, userId}
     ↓
  [n8n Workflow Execution]
     Webhook → Get Messages from Firestore
     → Code: Format messages
     → OpenAI: Generate summary
     → Code: Format response
     → Respond to Webhook: [{summary: "..."}]
     ↓
  [Extract summary from array: data[0].summary]
  ↓
  [Personalize summary]
     Fetch all users from Firestore
     Replace user IDs with names
     Replace current user's name with "You"
  ↓
  [Return tool result to OpenAI]
    {tool_call_id, role: 'tool', content: JSON.stringify({summary})}
         ↓
[IF no tool OR AFTER tool execution]
  OpenAI second API call (with tool results)
  → Generate final response
         ↓
[STEP 4: Store AI response]
  services/chat.ts: sendMessage()
  → Firestore: conversations/{id}/messages/{msgId}
  {
    text: "AI response",
    senderId: "ai-assistant",
    createdAt: timestamp,
    deliveredTo: ["userId"],
    readBy: []
  }
         ↓
[UI Updates via real-time listener]
  useMessages hook → ChatMessages component
```

## Firestore Data Model

### Conversations Collection
```
conversations/{conversationId}
{
  participantIds: string[]        // Array of user IDs + 'ai-assistant' for AI chats
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Messages Subcollection
```
conversations/{conversationId}/messages/{messageId}
{
  text: string                    // Message content
  senderId: string                // User ID or 'ai-assistant'
  createdAt: Timestamp
  deliveredTo: string[]           // Array of user IDs who received the message
  readBy: string[]                // Array of user IDs who read the message
}
```

### Users Collection
```
users/{userId}
{
  name: string                    // Display name
  avatarColor: string             // Color for avatar
  lastSeen: Timestamp            // For presence tracking
  currentlyTypingIn: string       // Conversation ID where user is typing
}
```

## Current Features

1. **AI Conversation**: Auto-created on signup with participantIds `[userId, 'ai-assistant']`
2. **Sticky Header**: AI conversation rendered outside FlatList on conversations screen
3. **Tool Calling**: OpenAI detects keywords and calls n8n workflows
4. **Conversation Summarization**: Via `summarize_conversation` tool
5. **Search by Name**: Can find conversations by participant name
6. **Personalization**: Replaces user IDs with names and "You" for current user

## Environment Variables

- `EXPO_PUBLIC_OPENAI_API_KEY`: OpenAI API key
- `EXPO_PUBLIC_N8N_WEBHOOK_URL`: Base URL for n8n webhooks

## Current n8n Workflow

### Summarize Workflow (docs/n8n-workflow.md)
**Input**: `{conversationId, userId}`
**Steps**:
1. Webhook receives data
2. Get Messages from Firestore
3. Code: Format messages for OpenAI
4. OpenAI Message Model: Generate summary
5. Code: Format response
6. Respond to Webhook: `[{summary: "...", userName: "..."}]`

## Notes

- AI conversation detection: Checks if `participantIds.includes('ai-assistant')`
- Conversation history: Only includes user + AI messages (filters out other participants)
- CORS handling: No Content-Type header to avoid preflight OPTIONS requests
- Message status: Calculated from `deliveredTo` and `readBy` arrays
- Presence: Tracked via `lastSeen` timestamp (online if within 30 seconds)
