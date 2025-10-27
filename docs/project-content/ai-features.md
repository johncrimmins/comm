# AI Features Implementation Guide

## Overview

Comm includes intelligent AI features powered by OpenAI GPT-4o-mini that help users manage conversations more effectively. The AI features are implemented using function calling (tool use) and RAG (Retrieval-Augmented Generation) pipelines.

## Architecture

### AI Conversation Flow

```
User Message → Firestore (stored immediately)
                ↓
         Fetch conversation history
                ↓
         OpenAI API call with tools
                ↓
     Tool detected → n8n webhook
                ↓
         Fetch messages from Firestore
                ↓
         Process & personalize
                ↓
     AI response → Firestore
                ↓
         UI updates in real-time
```

### Key Components

- **`services/aiChat.ts`**: Orchestrates AI conversation flow
- **`services/openai.ts`**: OpenAI API integration with tool calling
- **`services/n8n.ts`**: RAG pipeline webhook integration
- **`services/aiPrompts.ts`**: Centralized AI prompts

## Chat with Comms (AI Assistant)

### Implementation

Every user gets an automatic AI conversation created during signup:

```typescript
// Auto-created during signup in lib/firebase/auth.ts
participantIds: [userId, 'ai-assistant']
```

### Features

#### 1. Conversation Summarization

**Keywords**: `summary`, `summarize`, `recap`, `review`

**How it works**:
1. User asks: "Summarize this conversation"
2. AI detects keywords and calls `summarize_conversation` tool
3. Tool searches for conversation by name or uses current conversation
4. n8n webhook fetches messages from Firestore
5. OpenAI generates summary
6. Response personalized (replaces user IDs with names)
7. AI presents summary to user

**Example**:
```
User: "Summarize my conversation with John"
AI: [Detects "summarize" keyword]
  → Calls summarize_conversation(participantName: "John")
  → Finds conversation with John
  → Returns: "Your conversation with John focused on project planning..."
```

#### 2. Action Item Extraction

**Keywords**: `action items`, `tasks`, `todo`, `what do I need to do`

**How it works**:
1. User asks: "What are the action items?"
2. AI calls `pull_actions` tool
3. Tool extracts actionable items from conversation
4. Returns formatted list of tasks

**Example**:
```
User: "What tasks came out of that conversation?"
AI: [Detects "tasks" keyword]
  → Calls pull_actions(conversationId: current)
  → Returns: "Action items from this conversation:
              1. You: Schedule meeting for next week
              2. Sarah: Send budget proposal
              3. Mike: Review design mockups"
```

#### 3. Decision Tracking

**Keywords**: `decisions`, `what did we decide`, `what was agreed`

**How it works**:
1. User asks: "What decisions did we make?"
2. AI calls `get_decisions` tool
3. Tool extracts key decisions from conversation
4. Returns list of agreed-upon decisions

**Example**:
```
User: "What did we decide in our last meeting?"
AI: [Detects "decisions" keyword]
  → Calls get_decisions(conversationId: current)
  → Returns: "Key decisions made:
              1. Move launch date to Q2
              2. Use React Native for mobile app
              3. Hire 2 additional developers"
```

## Message Transformations

### Implementation

Long-press the send button to reveal transformation options:
- **Concise**: Makes messages shorter
- **Professionalize**: Adds professional tone
- **Technicalize**: Uses precise technical terms

### Configuration

Transformations are defined in `services/messageTransformations.ts`:

```typescript
export const transformations: Transformation[] = [
  {
    id: 'concise',
    label: 'Concise',
    systemPrompt: 'Make messages more concise while preserving intent...'
  },
  // ... more transformations
];
```

### User Flow

1. User types message
2. Long-press send button (400ms)
3. Popover appears with transformation options
4. User selects transformation
5. OpenAI processes message
6. Transformed text replaces input
7. User sends transformed message

### Visual Design

- Popover animated with Reanimated spring animations
- Transforms appear as stacked buttons
- Tap outside to dismiss
- State flag prevents accidental sends

## OpenAI Tool Calling

### Tool Definitions

Located in `services/openai.ts`:

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'summarize_conversation',
      description: 'Summarize a conversation thread...',
      parameters: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' },
          participantName: { type: 'string' }
        }
      }
    }
  },
  // ... more tools
];
```

### Tool Execution Flow

1. **Keyword Detection**: AI detects keywords in user message
2. **Tool Call**: OpenAI decides to call a tool
3. **Parameter Resolution**: Tool parameters extracted
4. **Conversation Search**: Search by name if needed
5. **Webhook Call**: Call n8n webhook with conversation ID
6. **Data Fetching**: n8n fetches messages from Firestore
7. **Processing**: OpenAI processes conversation data
8. **Personalization**: Replace user IDs with names
9. **Final Response**: AI presents results to user

### Helper Functions

#### `resolveConversationId()`

Searches for conversations by participant name:

```typescript
async function resolveConversationId(
  params: { conversationId?: string; participantName?: string },
  userId: string,
  currentConversationId?: string
): Promise<string | null>
```

**Flow**:
1. If `conversationId` provided → use it
2. If `participantName` provided → search by name
3. Otherwise → use current conversation

#### `personalizeResponse()`

Replaces user IDs with display names:

```typescript
async function personalizeResponse(
  text: string,
  currentUserId: string
): Promise<string>
```

**Process**:
1. Fetch all user names from Firestore
2. Replace user IDs with names
3. Replace current user's name with "You"
4. Return personalized text

## RAG Integration

### n8n Webhooks

Three webhook endpoints:
- `/summarize` - Conversation summarization
- `/pull-actions` - Action item extraction
- `/get-decisions` - Decision tracking

### Webhook Pattern

```typescript
const baseUrl = N8N_WEBHOOK_URL;
const webhookUrl = `${baseUrl}/summarize`;
const response = await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({ conversationId, userId })
});
```

### Response Format

n8n returns array format:
```json
[{summary: "Conversation summary..."}]
```

Extracted in `services/n8n.ts`:
```typescript
if (Array.isArray(data) && data.length > 0) {
  return data[0].summary;
}
```

## Persona: Remote Team Professional

Comm is designed for remote team professionals who need to:
- Track decisions across multiple conversations
- Extract action items from group discussions
- Summarize long conversation threads
- Stay organized with multiple ongoing projects

### AI Features Address These Needs

1. **Thread Summarization**: Quickly catch up on missed conversations
2. **Action Item Extraction**: Never miss a task in group chats
3. **Smart Search**: Find conversations by participant name
4. **Priority Detection**: Flag urgent messages (future feature)
5. **Decision Tracking**: Document team agreements

## Performance Considerations

### Optimization Strategies

1. **Cache Tool Results**: Store results in Firestore for future retrieval
2. **Limit History**: Only fetch last 10 messages for context
3. **Debounce Tool Calls**: Prevent rapid-fire tool execution
4. **Error Handling**: Graceful fallbacks if tools fail

### Response Times

- **Simple queries**: <2 seconds
- **Tool execution**: <8 seconds (includes webhook + processing)
- **Transformations**: <3 seconds

## Future Enhancements

### Planned Features

1. **Proactive Assistant**: Automatic conversation analysis
2. **Meeting Notes**: Extract structured meeting summaries
3. **Key Takeaways**: Identify important points automatically
4. **Scheduling Agent**: Calendar integration for meetings
5. **Smart Replies**: Context-aware response suggestions

### Multi-Agent Architecture

Current system supports future multi-agent expansion:
- Summarize agent
- Detect Actions agent
- Track Decisions agent
- Scheduler agent

Each agent can be triggered independently based on user needs.

## Testing AI Features

### Manual Testing

1. **Open AI conversation**: Tap "Chat with Comms (AI)"
2. **Send test message**: "Summarize my conversation with Sarah"
3. **Verify tool call**: Check console logs for tool execution
4. **Verify response**: Confirm personalized summary returned

### Test Cases

- Summary request with no conversation history
- Action extraction from empty conversation
- Decision tracking with participant name search
- Multiple rapid tool calls
- Tool failure handling

## Environment Variables

Required for AI features:

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com
```

## Code Examples

### Sending AI Message

```typescript
import { sendAIMessage } from '@/services/aiChat';

await sendAIMessage(conversationId, userMessage, userId);
```

### Using Transformations

```typescript
import { transformText } from '@/services/openai';
import { transformations } from '@/services/messageTransformations';

const transformed = await transformText({
  text: "This is a test message",
  systemPrompt: transformations[0].systemPrompt
});
```

## Troubleshooting

### AI Not Responding

1. Check OpenAI API key in `.env`
2. Verify n8n webhook URL
3. Check console logs for errors
4. Test with simple message first

### Tool Calls Not Working

1. Verify keywords in user message
2. Check n8n webhook is running
3. Review tool definitions in `openai.ts`
4. Check Firestore permissions

### Slow Responses

1. Check network connectivity
2. Verify n8n instance performance
3. Reduce conversation history fetch size
4. Check OpenAI API status

## Documentation References

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Expo Router](https://docs.expo.dev/router/introduction/)
