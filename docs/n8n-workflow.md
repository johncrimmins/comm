# n8n Summarize Workflow

## Overview
Conversation summarization workflow powered by OpenAI, triggered from the AI agent.

## Inputs (from App → n8n)
```json
{
  "conversationId": "xyz",
  "userId": "abc"
}
```

- **conversationId**: Firestore conversation ID to summarize
- **userId**: Current user's ID (for security filtering)

## Workflow Steps
1. **Webhook** - Receives conversationId and userId
2. **Get Messages** - Fetches messages from `conversations/{conversationId}/messages`
3. **Code** - Formats messages for OpenAI
4. **OpenAI Message Model** - Generates summary
5. **Code** - Formats response
6. **Respond to Webhook** - Returns summary

## Outputs (from n8n → App)
```json
[{
  "summary": "The conversation discussed...",
  "userName": "john"
}]
```

- **summary**: AI-generated conversation summary
- **userName**: User's display name (for personalization)

## How It Works
1. AI agent detects "summary" keywords in user message
2. Calls n8n webhook with conversationId
3. n8n fetches messages from Firestore
4. OpenAI summarizes the conversation
5. App personalizes: replaces userName → "You"
6. AI responds with personalized summary

## Security
- Only conversations where userId is a participant
- Firestore query filters by conversationId
- No user access to unauthorized conversations

