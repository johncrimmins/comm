# Data Flows: Presence, Typing, and Message Delivery States

## Overview

This document explains how online/offline presence indicators, typing indicators, and message delivery states are handled in the Comm messaging app.

---

## 1. Online/Offline Presence Indicators

### Current Implementation
**Status**: Not implemented - placeholder exists.

### Data Flow
1. **User Profile Creation**: `lib/firebase/auth.ts` → `ensureUserProfile()` - Creates user with `status: 'online'`
2. **Header Display**: `app/chat/[id].tsx` → Lines 68-73 - Hardcoded "online" string
3. **No Real-Time Updates**: No listener for presence changes

### What Needs to Happen
- Update presence timestamp when user is active
- Listen to other users' presence timestamps
- Determine online/offline based on recent activity
- Update UI header accordingly

### Dead Code
- `status` field in user profiles set but never updated
- Hardcoded "online" rule in chat header

---

## 2. Typing Indicators

### Current Implementation
**Status**: Not implemented - TODO exists.

### Data Flow
1. **Placeholder**: `app/chat/[id].tsx` → Lines 71-72 - TODO comment

### What Needs to Happen
- Track when user starts/stops typing in input field
- Write typing state to Firestore
- Listen to other users' typing state
- Display indicator in header when others are typing

### Dead Code
- None

---

## 3. Message Delivery States (Sending → Sent → Delivered → Read)

### Current Implementation
**Status**: Fully implemented and working.

### Data Flow

#### **Sending (Optimistic)**
1. User sends: `app/chat/[id].tsx` → `handleSend()` → `services/chat.ts` → `sendMessage()`
2. Firestore write: Creates message document with `status: 'sent'`
3. UI update: Message appears via Firestore real-time listener

#### **Sent**
1. Set on: Firestore write acknowledgment in `sendMessage()`
2. Initial status: `status: 'sent'` on message document

#### **Delivered (Automatic)**
1. Trigger: Recipient receives message via `hooks/useMessages.ts` → Line 60-82
2. Update: Sets `conversations/{id}/state/state.delivery.lastDeliveredAt.{userId}` timestamp
3. Process: Compares message `createdAt` with delivery timestamp
4. Status change: `sent` → `delivered` when timestamp exists

#### **Read (User Action)**
1. Trigger: User opens chat screen
2. Action: `app/chat/[id].tsx` → Line 62-65 → `services/chat.ts` → `markRead()`
3. Update: Sets `conversations/{id}/state/state.read.lastReadAt.{userId}` timestamp
4. Status change: `delivered` → `read` when timestamp is later than message

#### **Status Updates on Sender's Device**
1. Listener: `hooks/useMessages.ts` → Line 108-183
2. Watches: `conversations/{id}/state/state` document for delivery/read timestamps
3. Logic: Compares message timestamps with state document timestamps
4. UI update: Message status updates in real-time
5. Display: `components/chat/Message.tsx` → Line 77 - Shows status only on current user's messages

### Firestore Structure
```
conversations/{id}/
  messages/{messageId}/ - text, senderId, createdAt, status
  state/state/ - delivery.lastDeliveredAt.{userId}, read.lastReadAt.{userId}
```

### Dead Code
- Initial `status` field on messages could be redundant but kept for backward compatibility

