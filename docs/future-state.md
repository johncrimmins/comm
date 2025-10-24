## Future State After Phase 1 (Firebase Integration Only)

Scope: This document defines the target codebase structure and behaviors after completing Phase 1. Phase 1 introduces Firebase Authentication and Firestore with a clean service boundary, replacing in-memory/mocked auth and message data on web/Expo Router. Offline persistence is explicitly out of scope for this phase.

### High-Level Outcomes
- Firebase initialized via modular SDK in `lib/firebase/*`.
- Email/password authentication wired into `useAuthForm`.
- Chat screen reads/writes messages via Firestore services instead of local mocks.
- No Android-specific work; no offline persistence; no styling changes.
- All changes are isolated, reversible, and Expo Go/browser compatible.

### Directory Structure (Incremental Additions Only)

```
app/
  _layout.tsx                 # unchanged (optional later: AuthGate)
  (auth)/index.tsx            # unchanged UI; form wires to Firebase via hook
  (tabs)/index.tsx            # unchanged
  chat/[id].tsx               # subscribes to Firestore messages; sends via service

lib/
  firebase/
    app.ts                    # initializeApp using EXPO_PUBLIC_* env
    auth.ts                   # getAuth + auth helpers
    db.ts                     # getFirestore (no offline persistence)

services/
  chat.ts                     # onMessages(), sendMessage()
  users.ts                    # (optional) create/read user profile

hooks/
  useAuthForm.ts              # now calls Firebase signIn/signUp

types/                        # unchanged
components/                   # unchanged
```

### Environment Variables (Expo client safe)
Set these in your environment (e.g., `.env`, or shell) so Expo injects them at build/runtime. Only non-secret public config is used on the client.

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Notes:
- Do not include private keys or Admin credentials in the client.
- We are not enabling Firestore offline persistence in this phase.

### Module Contracts

`lib/firebase/app.ts`
- Exports a singleton Firebase `app` initialized with `EXPO_PUBLIC_*` values.

`lib/firebase/auth.ts`
- Exports `auth`, `onAuth(cb)`, `signIn(email, password)`, `signUp(email, password)`, `logOut()`.

`lib/firebase/db.ts`
- Exports Firestore `db` via `getFirestore(app)` only (no persistence setup).

`services/chat.ts`
- `onMessages(conversationId, cb)` → subscribes to `conversations/{id}/messages` ordered by `createdAt asc`, maps to `{ id, text, senderId, createdAt }[]`.
- `sendMessage(conversationId, text, senderId)` → writes with `serverTimestamp()`.

`hooks/useAuthForm.ts`
- Replaces mock delay with calls to `signIn`/`signUp`; on success, `router.replace('/(tabs)')`.

### Screen Behavior Changes
- `app/chat/[id].tsx`: removes mock messages and state initialization from constants; uses `onMessages` subscription; sends via `sendMessage`.
- `app/(auth)/index.tsx`: unchanged visuals; submit now triggers Firebase auth.

### Firestore Shape (Minimum Viable)

```
conversations/{conversationId}
  messages/{messageId}
    text: string
    senderId: string
    createdAt: Timestamp
```

### Out of Scope in Phase 1
- Offline persistence (IndexedDB/AsyncStorage) → defer.
- Android-specific keyboard/layout behaviors → defer.
- Styling system migrations (Nativewind/Reusables) → defer.
- Auth gating/navigation guards → optional later addition.

### Validation Checklist
- App starts without Firebase initialization errors when `EXPO_PUBLIC_*` are set.
- Sign in/up executes and routes to `/(tabs)`.
- Chat screen displays live Firestore messages for a given `id`.
- Sending a message appends a new doc with server timestamp.

### Rollback Strategy
- Delete `lib/firebase/*`, `services/*` and revert changes to `useAuthForm` and `app/chat/[id].tsx` to restore mock-driven behavior.


