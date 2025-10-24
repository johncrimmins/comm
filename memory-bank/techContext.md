# Tech Context

## Stack
- Expo SDK 54, Expo Router 6
- React 19, React Native 0.81
- TypeScript 5.9
- Firebase (to be added)

## Development setup
- Install deps: `npm install`
- Start: `npx expo start` (scripts also available via `npm run ios|android|web`)
- Testing: `jest` via `jest-expo` preset
- Linting: `expo lint` (ESLint 9 + `eslint-config-expo`)

## Environment configuration (client-safe)
Set these variables so the client can initialize Firebase:
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

## Notable constraints
- No offline persistence or platform-specific adjustments in Phase 1.
- Only public Expo vars; never commit secrets.
- Keep changes isolated and compatible with Expo Go and web.

## Dependencies
- Present: Expo core packages, React/React Native, navigation, Jest.
- Planned: `firebase` package for modular SDK.
