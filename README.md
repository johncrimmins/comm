# Comm

Comm is a, cross‑platform messaging app with real‑time sync, offline persistence, group chats, and AI features. You can deploy it in minutes with Expo Go.

## Why Comm

- Real‑time messaging that feels instant
- Offline‑first reliability that survives restarts
- Group chats with read receipts and presence
- An integrated AI assistant that summarizes threads, extracts action items, and tracks decisions
- Polished TalkTime‑inspired design that looks great on iOS, Android, and Web

## Quickstart (Expo Go)

1. Install dependencies

   ```bash
   # Recommended for reproducible installs on CI and fresh clones
   npm ci || npm install
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

## Prerequisites

- Node.js 20.x (recommended) and npm 10+
  - Check: `node -v` and `npm -v`
- Expo CLI (optional): `npm i -g expo`
- A Firebase project (Firestore, Auth, and Storage enabled)
- An OpenAI API key (for AI features and transformations)
- An n8n instance/webhook URL (for RAG tool calls) — optional, only needed for AI summaries/actions/decisions
- iOS: Expo Go
- Android: Expo Go
- Any Device: Expo Go installed from the App Store/Play Store

If you don't have OpenAI configured yet, you can still run the app and use core messaging. Avoid the long‑press "transformations" and the AI conversation until keys are added.

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

## Environment Variables

Create a `.env` in the project root with the following:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_N8N_WEBHOOK_URL=
```

Tip (world‑class practice): include a versioned `.env.example` so contributors can copy it to `.env`.

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

## Dependencies (installed by npm)

All runtime deps are pinned in `package.json` and installed via `npm ci` or `npm install` — no manual package installs are required.

- @expo-google-fonts/inter ^0.4.2
- @expo/metro-runtime ~6.1.2
- @expo/ngrok ^4.1.3
- @expo/vector-icons ^15.0.2
- @react-native-async-storage/async-storage ^2.2.0
- @react-navigation/bottom-tabs ^7.3.10
- @react-navigation/elements ^2.3.8
- @react-navigation/native ^7.1.6
- expo ^54.0.9
- expo-blur ~15.0.7
- expo-constants ~18.0.9
- expo-file-system ^19.0.17
- expo-font ~14.0.8
- expo-haptics ~15.0.7
- expo-image ~3.0.8
- expo-image-picker ~17.0.8
- expo-linear-gradient ^15.0.7
- expo-linking ~8.0.8
- expo-router ~6.0.7
- expo-splash-screen ~31.0.10
- expo-status-bar ~3.0.8
- expo-symbols ~1.0.7
- expo-system-ui ~6.0.7
- expo-web-browser ~15.0.7
- firebase ^12.4.0
- react 19.1.0
- react-dom 19.1.0
- react-native 0.81.5
- react-native-gesture-handler ~2.28.0
- react-native-reanimated ~4.1.0
- react-native-safe-area-context ~5.6.0
- react-native-screens ~4.16.0
- react-native-web ^0.21.0
- react-native-webview 13.15.0
- react-native-worklets 0.5.1

Dev deps (installed automatically):

- @babel/core ^7.25.2
- @types/react ~19.1.10
- eslint ^9.25.0
- eslint-config-expo ~10.0.0
- jest ^29.2.1
- jest-expo ~54.0.12
- typescript ~5.9.2

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

## World‑Class Repo Practices (Recommended)

- Pin Node with `.nvmrc` and recommend `nvm use` before install
- Commit a `.env.example` and document all required keys
- Prefer `npm ci` for reproducible installs on CI/fresh clones
- Include a "One‑Command" dev script (e.g., `make dev` or `npm run dev`)
- Add a small "Troubleshooting" section (cache reset, simulator issues)
- Keep a CHANGELOG and use conventional commits
- Consider `volta` or `asdf` to pin runtime tool versions

If you want, I can add `.env.example`, `.nvmrc`, and a Makefile with a single `make dev` to get contributors running in one step.

## License

For evaluation and learning. Replace with your license of choice.
