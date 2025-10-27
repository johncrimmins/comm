# Comm

Build a modern, cross‑platform messaging app with real‑time sync, offline persistence, group chats, and AI features — in minutes with Expo Go.

## Why Comm

- Real‑time messaging that feels instant
- Offline‑first reliability that survives restarts
- Group chats with read receipts and presence
- An integrated AI assistant that summarizes threads, extracts action items, and tracks decisions
- Polished TalkTime‑inspired design that looks great on iOS, Android, and Web

## Quickstart (Expo Go)

1. Install dependencies

   ```bash
   npm install
   ```

2. Add environment variables (create a `.env` file)

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   EXPO_PUBLIC_OPENAI_API_KEY=...
   EXPO_PUBLIC_N8N_WEBHOOK_URL=...
   ```

3. Start the app

   ```bash
   npx expo start
   ```

4. Open on device with Expo Go (or press `i` for iOS simulator, `a` for Android emulator)

## Features

- One‑on‑one and group chats (3+ users)
- Real‑time delivery with optimistic UI
- Read receipts (sent / delivered / read)
- Presence and typing indicators
- Foreground push notifications (expo‑notifications)
- Image attachments with preview (Firebase Storage)
- AI conversation (Chat with Comms) powered by OpenAI
- Message transformations (Concise, Professionalize, Technicalize)
- Cross‑platform: iOS, Android, Web

## AI Superpowers

- Summarize long threads on demand
- Extract action items from discussions
- Surface key decisions made in chats
- Search by participant name and operate on that conversation

Backed by OpenAI function calling + n8n RAG workflows, with results stored and rendered in‑app.

## Architecture

- Expo Router v6 with file‑based routes in `app/`
- Firebase Auth + Firestore (real‑time listeners, offline cache)
- Firebase Storage for media
- Service layer in `services/` (chat, AI, n8n, storage, presence)
- Hooks in `hooks/` (messages, conversations, notifications, presence)
- Centralized theming in `styles/`

Key files:
- `app/chat/[id].tsx` — chat screen, presence, image send, AI handling
- `services/chat.ts` — sending, delivery/read tracking
- `services/aiChat.ts`, `services/openai.ts`, `services/n8n.ts` — AI + tools
- `hooks/useMessages.ts`, `hooks/useNotifications.ts`, `hooks/usePresence.ts`

## Screenshots / Demos

- Real‑time updates on two devices
- Group chat with presence and read receipts
- AI assistant summarizing an active thread
- Image attachment preview and send

(Add your screenshots or Loom links here.)

## Developer Experience

- Start fast with Expo Go — no native builds required
- Strict TypeScript for clarity
- Clean separation of concerns (services + hooks)
- Smooth animations with Reanimated

## Documentation

See detailed docs in `docs/project-content/`:
- README (deep‑dive), AI features, real‑time messaging, offline support, message transformations, feature summary, persona brainlift

## Scripts

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web
npm test           # Jest tests
npm run lint       # ESLint
```

## License

For evaluation and learning. Replace with your license of choice.
