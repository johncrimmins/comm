# SafeAreaView Migration Plan

## Problem
React Native's `SafeAreaView` is deprecated and causing rendering issues in Expo SDK 54.

## Solution
Migrate to `react-native-safe-area-context` library which is already a peer dependency of Expo Router.

## Key Points from Docs
- ✅ `react-native-safe-area-context` is already included as a peer dependency for Expo Router
- ✅ Expo Router automatically wraps the app with `SafeAreaProvider` 
- ✅ We can use `<SafeAreaView>` directly from `react-native-safe-area-context`
- ✅ No manual `SafeAreaProvider` wrapper needed (Expo Router handles it)

## Implementation Plan

### Step 1: Update imports in 3 files
Replace:
```typescript
import { SafeAreaView } from 'react-native';
```

With:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
```

### Files to Update:
1. `app/chat/[id].tsx`
2. `app/(tabs)/index.tsx`
3. `app/new-conversation.tsx`

### Step 2: Verify
- Run app and test on iOS (notches)
- Run app and test on Android (status bar)
- Run app and test on Web
- Ensure no visual regressions

## Expected Result
- ✅ No deprecation warnings
- ✅ Proper safe area handling on all platforms
- ✅ No loss of functionality
- ✅ Better rendering with proper insets

## Implementation Time
~5 minutes - simple import replacement

