# Code Refactoring Summary

## Overview
Simplified the OpenAI service by extracting duplicated logic into reusable helper functions.

## Changes Made

### Helper Functions Created

**1. `resolveConversationId()`** (lines 96-126)
- Extracts conversation ID resolution logic
- Handles searching by participant name
- Falls back to current conversation
- Used by both `summarize_conversation` and `pull_actions` tools

**2. `personalizeResponse()`** (lines 131-182)
- Extracts personalization logic
- Fetches user names from Firebase
- Replaces user IDs with names
- Replaces current user's name with "You"
- Uses same regex patterns for both tools

### Simplified Tool Handlers

**Before:** ~110 lines of duplicated code per tool
**After:** ~40 lines per tool using helpers

**Summarize Tool** (lines 312-353):
```typescript
if (toolCall.function.name === 'summarize_conversation') {
  const params = JSON.parse(toolCall.function.arguments);
  
  // Resolve conversation ID
  const conversationId = await resolveConversationId(...);
  
  // Handle not found
  if (!conversationId && params.participantName) { ... }
  
  // Call n8n webhook
  const summary = await summarizeConversation(...);
  
  // Personalize
  const personalizedSummary = await personalizeResponse(summary, userId);
  
  return { ... };
}
```

**Pull Actions Tool** (lines 356-397):
- Identical pattern, just calls `pullActions()` instead of `summarizeConversation()`

## Benefits

1. **Reduced Code**: ~90 lines of duplication removed
2. **Easier Maintenance**: Logic centralized in helper functions
3. **Consistency**: Both tools use identical patterns
4. **Testing**: Helper functions can be tested independently
5. **Future Tools**: New tools can reuse the same helpers

## Files Modified

- `services/openai.ts`: Extracted helpers and simplified tool handlers

## Impact

- **No breaking changes**: Functionality remains identical
- **No new dependencies**: Pure code organization
- **No API changes**: External interfaces unchanged
- **Better code quality**: DRY principle applied