# Feature Implementation Approaches

## Features to Implement

1. **Add Titles to Conversations**: Firestore data model should include titles for conversations
2. **Action Items Extraction**: AI agent should extract action items from conversations via `pull_actions` tool

## Approach 1: Minimal Changes (Recommended)

### Overview
Leverage existing infrastructure with minimal modifications to Firestore schema and n8n workflows.

### Changes Required

#### App Code Changes

**1. Firestore Schema Update** (`services/chat.ts`)
```typescript
// Update createOrFindConversation to accept optional title
export async function createOrFindConversation(
  participantIds: string[],
  title?: string
): Promise<{ conversationId: string }> {
  // ... existing code ...
  
  await setDoc(conversationRef, {
    participantIds: sortedParticipants,
    title: title || null,  // Add title field
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
```

**2. Update Conversation Type** (`hooks/useConversation.ts`)
```typescript
export type ConversationData = {
  participantIds: string[];
  title?: string;  // Add title field
  createdAt?: any;
  updatedAt?: any;
};
```

**3. Update Conversation Display** (`hooks/useConversations.ts`)
```typescript
// Use title if available, otherwise use participant names
let displayName = conversationData.title || generatedParticipantNames;
```

**4. Add Action Items Tool** (`services/openai.ts`)
```typescript
// Add to tools array in chatWithAI function
{
  type: 'function',
  function: {
    name: 'pull_actions',
    description: 'Extract action items from a conversation thread. Can use conversation ID directly or search by participant name.',
    parameters: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'The ID of the conversation to extract actions from. Leave empty if using participantName to search.'
        },
        participantName: {
          type: 'string',
          description: 'Name of a participant in the conversation. Use this if the user mentions someone by name.'
        }
      },
      required: []
    }
  }
}
```

**5. Implement Tool Handler** (`services/openai.ts`)
```typescript
// Add to tool execution logic (around line 320)
if (toolCall.function.name === 'pull_actions') {
  const params = JSON.parse(toolCall.function.arguments);
  
  // Same conversation resolution logic as summarize_conversation
  let conversationId = params.conversationId;
  
  if (!conversationId && params.participantName) {
    const foundId = await findConversationByParticipant({
      userId: options.userId || '',
      participantName: params.participantName
    });
    conversationId = foundId || options.currentConversationId || '';
  }
  
  // Call n8n webhook for action items
  const actionsResponse = await pullActions({
    conversationId: conversationId,
    userId: options.userId || ''
  });
  
  // Personalize response (same logic as summarize)
  // ... 
  
  return {
    tool_call_id: toolCall.id,
    role: 'tool',
    name: 'pull_actions',
    content: JSON.stringify({ actions: personalizedActions })
  };
}
```

**6. Add n8n Service Function** (`services/n8n.ts`)
```typescript
export async function pullActions(params: N8NToolParams): Promise<string> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('n8n webhook URL not configured');
  }

  const webhookUrl = N8N_WEBHOOK_URL.endsWith('/') 
    ? N8N_WEBHOOK_URL.slice(0, -1) 
    : N8N_WEBHOOK_URL;
  
  // Append /pull-actions to base URL
  const actionWebhookUrl = `${webhookUrl}/pull-actions`;
  
  const response = await fetch(actionWebhookUrl, {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`n8n webhook error: ${response.status}`);
  }

  const data = JSON.parse(await response.text());
  
  // Handle array format: [{actions: "..."}]
  if (Array.isArray(data) && data.length > 0) {
    return data[0].actions || 'No action items found';
  }
  
  return data.actions || 'No action items found';
}
```

**7. Update AI Prompt** (`services/aiPrompts.ts`)
```typescript
default: `You are Comms, a helpful AI assistant integrated into this messaging app.
...
When users ask to summarize conversations (keywords: "summary", "summarize", "recap", "review"), use the summarize_conversation tool.
When users ask about action items or tasks (keywords: "action items", "tasks", "todo", "what do I need to do"), use the pull_actions tool to extract actionable items.
...`
```

#### n8n Workflow Changes

**1. Duplicate Summarize Workflow**
- Copy existing summarize workflow
- Rename to "Pull Actions"
- Save as new workflow

**2. Modify OpenAI Prompt**
- Change from: "Summarize this conversation..."
- Change to: "Extract actionable items from this conversation. List specific tasks, assignments, and follow-ups mentioned. Focus on what needs to be done, by whom, and any deadlines."

**3. Update Response Format**
- Change output field from `summary` to `actions`
- Respond to Webhook: `[{actions: "...", userName: "..."}]`

**4. Update Webhook URL**
- Use: `{baseUrl}/pull-actions` instead of main webhook URL

### Data Flow

```
[User asks: "action items from finance conversation?"]
         ↓
[OpenAI detects keywords: "action items"]
         ↓
[Tool call: pull_actions({participantName: "finance"})]
         ↓
[Find conversation by participantName]
         ↓
[n8n webhook call: /pull-actions with {conversationId, userId}]
         ↓
[n8n workflow: Fetch messages → Extract actions → Return]
         ↓
[Personalize: Replace IDs with names, "You" for current user]
         ↓
[Final AI response with actions]
```

### Pros
- Minimal code changes
- Reuses existing patterns
- Clean separation of concerns
- Easy to test

### Cons
- Requires n8n workflow duplication
- Still need to update webhook URLs

---

## Approach 2: Unified Webhook Handler

### Overview
Single n8n webhook that handles multiple operation types via a `type` parameter.

### Changes Required

#### App Code Changes

**1. Generic Webhook Function** (`services/n8n.ts`)
```typescript
export async function callN8nTool(
  type: 'summarize' | 'pull_actions',
  params: N8NToolParams
): Promise<string> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('n8n webhook URL not configured');
  }

  const webhookUrl = N8N_WEBHOOK_URL.endsWith('/') 
    ? N8N_WEBHOOK_URL.slice(0, -1) 
    : N8N_WEBHOOK_URL;
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({
      ...params,
      operationType: type  // Add operation type
    }),
  });

  const data = JSON.parse(await response.text());
  
  // Handle unified response format
  if (Array.isArray(data) && data.length > 0) {
    return data[0][type === 'summarize' ? 'summary' : 'actions'] || '';
  }
  
  return data[type === 'summarize' ? 'summary' : 'actions'] || '';
}

// Keep existing summarizeConversation for backwards compatibility
export async function summarizeConversation(params: N8NToolParams): Promise<string> {
  return callN8nTool('summarize', params);
}

// New function
export async function pullActions(params: N8NToolParams): Promise<string> {
  return callN8nTool('pull_actions', params);
}
```

**2. Update Tool Call Logic** (`services/openai.ts`)
```typescript
// Both tools can use same pattern
if (toolCall.function.name === 'summarize_conversation') {
  // ... existing code ...
  const summaryResponse = await summarizeConversation({
    conversationId: conversationId,
    userId: options.userId || ''
  });
  // ...
}

if (toolCall.function.name === 'pull_actions') {
  // ... same pattern ...
  const actionsResponse = await pullActions({
    conversationId: conversationId,
    userId: options.userId || ''
  });
  // ...
}
```

#### n8n Workflow Changes

**1. Single Workflow with Switch Node**
- Webhook receives: `{conversationId, userId, operationType}`
- Add Switch node after Webhook
- Route based on `operationType`:
  - Case: "summarize" → Summarize path
  - Case: "pull_actions" → Extract actions path
- Merge responses before Respond to Webhook

**2. Two Parallel Paths**
```
Webhook → Switch Node
         ├─> Summarize → OpenAI (summary prompt) → Format → Merge
         └─> Pull Actions → OpenAI (actions prompt) → Format → Merge
                                                ↓
                                    Respond to Webhook
```

### Pros
- Single webhook URL
- Easier to maintain
- Unified response handling

### Cons
- More complex n8n workflow
- Requires Switch node configuration
- More error-prone

---

## Approach 3: Conversation Title Field

### Overview
Add title field to conversations and include in n8n workflow context.

### App Code Changes (Same as Approach 1)
- Add `title` field to conversation documents
- Update conversation types
- Use title in conversation display

### n8n Workflow Changes

**1. Fetch Conversation Title**
```
Webhook → Get Conversation Document (new node)
       → Extract title field
       → Pass to OpenAI as context
```

**2. Update OpenAI Prompt**
```
System: "This conversation is titled '{title}'. Analyze the messages below..."

User: [messages array]
```

**3. Include Title in Response**
```
Respond to Webhook: [{
  summary: "...",
  title: "Finance Discussion",  // Include title
  userName: "..."
}]
```

### Benefits
- Provides context to AI
- Helps with conversation identification
- Improves summarization quality

---

## Recommended Implementation Plan

### Phase 1: Add Titles (Approach 1)
1. Update Firestore schema (`services/chat.ts`)
2. Update conversation types (`hooks/useConversation.ts`)
3. Update conversation display (`hooks/useConversations.ts`)
4. Test title persistence and display

### Phase 2: Add Action Items Tool (Approach 1)
1. Add `pull_actions` tool definition (`services/openai.ts`)
2. Implement tool handler with conversation resolution
3. Add `pullActions` function (`services/n8n.ts`)
4. Update AI prompt (`services/aiPrompts.ts`)
5. Create n8n workflow (duplicate summarize)
6. Test end-to-end flow

### Phase 3: Enhance n8n Workflows (Approach 3)
1. Update n8n workflows to fetch conversation title
2. Include title in context to OpenAI
3. Return title in response
4. Update app to display title in summaries/actions

---

## Environment Variables

No new environment variables needed. Uses existing:
- `EXPO_PUBLIC_N8N_WEBHOOK_URL` (can append paths)

---

## Testing Checklist

- [ ] Conversation titles persist in Firestore
- [ ] Titles display in conversation list
- [ ] AI can extract action items from conversations
- [ ] Search by participant name works for action items
- [ ] Action items are personalized ("You" instead of user name)
- [ ] n8n workflow returns correct format
- [ ] Error handling works gracefully
- [ ] No performance degradation
