# Tech Context

## Tooling
- Expo SDK: 54 (`expo@^54.0.9`)
- React: `19.1.0`
- React Native: `0.81.4` (New Arch enabled)
- TypeScript: `~5.9.2` (strict: true)
- Router: `expo-router@~6.0.7` with typed routes enabled in `app.json`
- Testing: `jest-expo@~54.0.12` (preset), `jest@^29.2.1`
- Linting: `eslint@^9.25.0`, `eslint-config-expo@~10.0.0`

## App Configuration (from `app.json`)
- name/slug: `expo-on-replit`
- scheme: `myapp`
- newArchEnabled: `true`
- web bundler: `metro`, static output
- splash screen configured via `expo-splash-screen` plugin

## Path Aliases (from `tsconfig.json`)
- `@/*` → project root (kept this way; no `src/` folder). Expo Router expects root-level `app/`.

## Dependencies (declared versions)

### Runtime
- @expo-google-fonts/inter: `^0.4.2`
- @expo/metro-runtime: `~6.1.2`
- @expo/ngrok: `^4.1.3`
- @expo/vector-icons: `^15.0.2`
- @react-navigation/bottom-tabs: `^7.3.10`
- @react-navigation/elements: `^2.3.8`
- @react-navigation/native: `^7.1.6`
- expo: `^54.0.9`
- expo-blur: `~15.0.7`
- expo-constants: `~18.0.9`
- expo-font: `~14.0.8`
- expo-haptics: `~15.0.7`
- expo-image: `~3.0.8`
- expo-linear-gradient: `^15.0.7`
- expo-linking: `~8.0.8`
- expo-router: `~6.0.7`
- expo-splash-screen: `~31.0.10`
- expo-status-bar: `~3.0.8`
- expo-symbols: `~1.0.7`
- expo-system-ui: `~6.0.7`
- expo-web-browser: `~15.0.7`
- react: `19.1.0`
- react-dom: `19.1.0`
- react-native: `0.81.4`
- react-native-gesture-handler: `~2.28.0`
- react-native-reanimated: `~4.1.0`
- react-native-safe-area-context: `~5.6.0`
- react-native-screens: `~4.16.0`
- react-native-web: `^0.21.0`
- react-native-webview: `13.15.0`
- react-native-worklets: `0.5.1`

### Dev
- @babel/core: `^7.25.2`
- @types/react: `^19.1.13`
- eslint: `^9.25.0`
- eslint-config-expo: `~10.0.0`
- jest: `^29.2.1`
- jest-expo: `~54.0.12`
- typescript: `~5.9.2`

## Scripts
- start: `expo start`
- reset-project: `node ./scripts/reset-project.js`
- android: `expo start --android`
- ios: `expo start --ios`
- web: `expo start --web`
- test: `jest --watchAll`
- lint: `expo lint`

## Notes
- Declared versions use a mix of caret (^), tilde (~), and pinned versions. See lockfile for exact resolved versions when installed.
