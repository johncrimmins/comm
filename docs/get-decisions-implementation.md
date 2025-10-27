# Get Decisions Tool Implementation

## Overview
Added `get_decisions` tool to extract key decisions from conversations, following the same pattern as `pull_actions` and `summarize_conversation`.

## Implementation

### App Code Changes

**1. services/openai.ts**
- Added `get_decisions` tool definition to tools array
- Added tool handler using shared helper functions (`resolveConversationId`, `personalizeResponse`)
- Imported `getDecisions` from n8n service

**2. services/n8n.ts**
- Added `getDecisions()` function
- Calls webhook at `{baseUrl}/get-decisions`
- Extracts `decisions` field from response: `[{decisions: "..."}]`

**3. services/aiPrompts.ts**
- Updated AI prompt to mention `get_decisions` tool
- Keywords: "decisions", "what did we decide", "what was decided", "what did we agree on"

## How It Works

### User Flow Example:
```
User: "What decisions did we make in the finance conversation?"
  ↓
AI detects keywords: "decisions", "finance conversation"
  ↓
Tool call: get_decisions({participantName: "finance"})
  ↓
Search conversation by name → Find conversation ID
  ↓
n8n webhook: POST to /get-decisions with {conversationId, userId}
  ↓
n8n workflow: Extract decisions → OpenAI → Return
  ↓
Personalize: Replace IDs with names, "You" for current user
  ↓
Final AI response with decisions
```

## n8n Workflow Setup

### Create "Get Decisions" Workflow

1. **Duplicate** existing "Summarize" or "Pull Actions" workflow
2. **Rename** to "Get Decisions"
3. **Set webhook path**: `/get-decisions`
4. **Update OpenAI prompt**:
   ```
   Extract key decisions made in this conversation. List what was agreed upon, 
   commitments made, and any choices that were finalized. Focus on outcomes 
   and agreements rather than tasks or action items.
   ```
5. **Update response format**: Change output field to `decisions`
6. **Response**: `[{decisions: "...", userName: "..."}]`

## Data Flow

**Input to n8n**: `{conversationId: "...", userId: "..."}`
**Output from n8n**: `[{decisions: "..."}]`
**After personalization**: User IDs replaced with names, current user becomes "You"

## Keywords

The AI will trigger this tool when users ask about:
- "decisions"
- "what did we decide"
- "what was decided"
- "what did we agree on"
- "what decisions were made"

## Files Modified

- `services/openai.ts` - Added tool definition and handler
- `services/n8n.ts` - Added getDecisions function
- `services/aiPrompts.ts` - Updated AI prompt

## Testing

Try these prompts in AI chat:
- "What decisions did we make in the finance conversation?"
- "Show me decisions from my conversation with Sarah"
- "What did we agree on in that meeting?"

## Webhook URL

The workflow will be called at:
```
{EXPO_PUBLIC_N8N_WEBHOOK_URL}/get-decisions
```

Same environment variable as other workflows - just append the path.
