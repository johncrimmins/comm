# Chat Screen Component Extraction Plan

## Goal
Extract 3 focused components from `app/chat/[id].tsx` to improve maintainability and reusability.

## Components to Extract

### 1. ChatHeader
**Location:** `components/chat/ChatHeader.tsx`
**Responsibility:** Back button, title, presence status, AI button
**Lines:** 155-174 (+ styles)

### 2. ChatInput  
**Location:** `components/chat/ChatInput.tsx`
**Responsibility:** Text input field and send button
**Lines:** 186-217 (+ styles)

### 3. ChatMessages
**Location:** `components/chat/ChatMessages.tsx`
**Responsibility:** Message list rendering
**Lines:** 176-184 + renderMessage function

## Implementation Steps

1. Create `components/chat/ChatHeader.tsx` with props interface
2. Create `components/chat/ChatInput.tsx` with props interface  
3. Create `components/chat/ChatMessages.tsx` with props interface
4. Update `app/chat/[id].tsx` to import and use components
5. Verify all functionality works

## Expected Result
- Main chat screen reduced from 319 to ~150 lines
- Each component <100 lines with clear responsibility
- All existing functionality preserved

