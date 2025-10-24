## Phase 1 Implementation Spec (for gpt5-codex)

Source of Truth: See `docs/future-state.md` for the desired end state after Phase 1. Only implement what is described there. Defer all Android-specific, offline persistence, and styling migrations.

### Objective
Introduce Firebase Authentication (email/password) and Firestore-backed chat messages. Replace screen-level mocks with service calls. Keep UI components and styling unchanged.

### Constraints
- Expo Go + Web target first. No Android-specific changes.
- Do not implement offline persistence (IndexedDB/AsyncStorage).
- Do not modify styling or introduce Nativewind/Reusables in this phase.
- Keep changes small, isolated, and reversible.

### Dependencies
- Add `firebase` to `dependencies` if missing.

### Files to Create
1. `lib/firebase/app.ts`
   - Initialize Firebase using `EXPO_PUBLIC_*` env vars described in `docs/future-state.md`.
   - Export a singleton `app`.

2. `lib/firebase/auth.ts`
   - Export `auth` from `getAuth(app)`.
   - Export helpers: `onAuth(cb)`, `signIn(email, password)`, `signUp(email, password)`, `logOut()`.

3. `lib/firebase/db.ts`
   - Export `db` via `getFirestore(app)` only. No persistence.

4. `services/chat.ts`
   - Export `onMessages(conversationId, cb)` subscribing to `conversations/{id}/messages` ordered by `createdAt asc` mapping to typed messages.
   - Export `sendMessage(conversationId, text, senderId)` writing with `serverTimestamp()`.

5. (Optional placeholder) `services/users.ts`
   - Leave empty or with a stub for later profile creation.

### Files to Modify
1. `hooks/useAuthForm.ts`
   - Replace mock delay with Firebase `signIn`/`signUp` logic.
   - On success, `router.replace('/(tabs)')` (existing behavior).
   - Preserve validation and UI state handling.

2. `app/chat/[id].tsx`
   - Remove use of `MOCK_CONVERSATIONS_DATA` and associated message state initialization.
   - Subscribe to messages with `onMessages(convId, setMessages)` inside `useEffect`.
   - Update `handleSend` to call `sendMessage(convId, inputText, 'me')` then clear input.
   - Retain UI layout and styling; do not change list rendering except for data source.

### Types
Create a local message type in `services/chat.ts` and reuse in `app/chat/[id].tsx` if convenient. Minimum fields: `id?: string`, `text: string`, `senderId: string`, `createdAt: Timestamp | Date | null`.

### Environment
Ensure the following `EXPO_PUBLIC_*` env vars are expected by `lib/firebase/app.ts`:

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

Do not add sensitive values to the repo. The developer will supply them at runtime.

### Non-Goals (Explicit)
- No IndexedDB/AsyncStorage persistence setup.
- No Android keyboard/layout adjustments.
- No design system changes.
- No auth gate routing logic in `_layout.tsx`.

### Acceptance Criteria
- Build runs in Expo Go (web) without Firebase initialization errors when env vars are set.
- Sign in/up in `(auth)/index.tsx` successfully calls Firebase and routes to `/(tabs)`.
- `app/chat/[id].tsx` displays live messages for the route param id and can send a new message which appears in the list.

### Rollback
Revert modifications to `useAuthForm.ts` and `app/chat/[id].tsx`; delete `lib/firebase/*` and `services/*`.


