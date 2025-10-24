# System Patterns

## Architecture overview
- Expo Router application with screens in `app/*`.
- UI logic delegates to hooks and service modules.
- Firebase modules in `lib/firebase/*` provide app, auth, and Firestore instances (client-only, modular SDK).
- Domain services in `services/*` encapsulate Firestore queries and writes.

## Key patterns and decisions
- Clear module contracts for Firebase and service layers to keep screens thin and testable.
- Reversibility: edits are isolated so the codebase can revert to mock logic if needed.
- No offline persistence; prioritize real-time reads/writes via Firestore.
- Environment values provided via Expo `EXPO_PUBLIC_*` at runtime; no private keys.

## Module contracts
- `lib/firebase/app.ts`: exports a singleton Firebase app initialized from env vars.
- `lib/firebase/auth.ts`: exports `auth` plus helpers `onAuth`, `signIn`, `signUp`, `logOut`.
- `lib/firebase/db.ts`: exports `db` from `getFirestore(app)` (no persistence setup).
- `services/chat.ts`: exports `onMessages(conversationId, cb)` and `sendMessage(conversationId, text, senderId)`.

## Data model (minimum viable)
```
conversations/{conversationId}
  messages/{messageId}
    text: string
    senderId: string
    createdAt: Timestamp
```
