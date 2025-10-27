# UI/UX Architecture & Data Flow Mapping

## Executive Summary

Comm is a modern messaging app built with **Expo SDK 54** and **React Native 0.81**, implementing a sophisticated UI/UX architecture that leverages native design patterns, cross-platform safe area handling, and a centralized styling system. The app features a **Noir + Amber** theme with flat design principles, ensuring seamless experiences across iOS, Android, and Web platforms.

---

## Tech Stack & Versions

- **Expo SDK**: 54.0.9
- **React**: 19.1.0
- **React Native**: 0.81.5 (New Architecture enabled)
- **TypeScript**: 5.9.2 (strict mode)
- **Router**: Expo Router 6.0.7 with typed routes
- **UI Libraries**: 
  - `react-native-safe-area-context` 5.6.0
  - `react-native-gesture-handler` 2.28.0
  - `react-native-reanimated` 4.1.0
  - `expo-linear-gradient` 15.0.7

---

## 1. Architecture Overview

### File-Based Routing (Expo Router v6)

```
app/
├── _layout.tsx           # Root layout with SafeAreaProvider
├── (auth)/
│   ├── _layout.tsx       # Auth stack
│   └── index.tsx         # Sign in/sign up screen
├── (tabs)/
│   ├── _layout.tsx       # Bottom tabs config
│   ├── index.tsx         # Conversations list
│   └── profile.tsx       # User profile
├── chat/
│   └── [id].tsx          # Dynamic chat screen
└── new-conversation.tsx  # Contact selection
```

### Component Organization

```
components/
├── auth/                 # Authentication UI
├── chat/                 # Chat-specific components
├── conversation/         # Conversation list components
└── ui/                   # Reusable primitives
```

### Styling System

```
styles/
├── theme.ts                      # Design tokens
├── screens/                      # Screen-specific styles
│   ├── auth.ts
│   ├── chat.ts
│   ├── tabs.ts
│   └── newConversation.ts
└── components/                   # Component-specific styles
    └── chatInput.ts
```

---

## 2. Safe Area Handling Strategy

### Root-Level Setup

**Location**: `app/_layout.tsx`

```47:58:app/_layout.tsx
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DarkTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="new-conversation" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
```

**Key Implementation Points**:
- `<SafeAreaProvider>` wraps entire app at root level
- This enables `SafeAreaView` components to access device insets
- StatusBar configured globally with `style="light"` for dark theme

### Screen-Level Safe Area Patterns

#### Tabs Screen (Conversations List)
**Edges**: `['top', 'right']`

```203:203:app/(tabs)/index.tsx
        <SafeAreaView style={tabsStyles.container} edges={edges}>
```

**Rationale**:
- `top`: Protects content from status bar/notch on iOS
- `right`: Protects from iOS home indicator on landscape orientation
- Asymmetric padding handled manually via `paddingLeft`/`paddingRight`

#### Chat Screen
**Edges**: `['top']`

```158:158:app/chat/[id].tsx
      <SafeAreaView style={chatStyles.container} edges={['top']}>
```

**Rationale**:
- Only needs top protection for status bar
- Bottom safe area handled by keyboard avoidance

#### Profile Screen
**Edges**: `['top']`

```14:14:app/(tabs)/profile.tsx
      <SafeAreaView style={styles.container} edges={['top']}>
```

**Rationale**:
- Standard screen with top edge protection only

### Platform-Specific Considerations

**Best Practice from Expo SDK 54 Docs**:
- Use `SafeAreaView` from `react-native-safe-area-context` (not `react-native`)
- Configure `edges` prop for granular control per screen
- For custom layouts, use `useSafeAreaInsets()` hook
- Web platform doesn't require safe area handling (browser handles it)

---

## 3. Data Flow Architecture

### Real-Time Messaging Flow

```
User Action → Service Layer → Firestore → onSnapshot Listener → UI Update
```

#### Send Message Flow

```
ChatInput.onSend() 
  → sendMessage(convId, text, uid) [services/chat.ts]
    → addDoc(conversations/{id}/messages/{msgId})
      → Firestore write
        → onSnapshot listener triggers
          → useMessages hook updates
            → ChatMessages re-renders
              → Message bubbles appear
```

#### Receive Message Flow

```
Firestore write (another user)
  → onSnapshot listener detects change
    → useMessages hook updates state
      → ChatMessages re-renders
        → New Message bubble appears
          → Notification triggered (if other conversation)
```

### State Management Pattern

**No Global State Library** - Using local state + Firestore:

1. **Firestore as Single Source of Truth**
   - All data persisted in Firestore
   - Real-time listeners via `onSnapshot`
   - Optimistic UI updates on send

2. **Hooks Pattern**
   ```
   useAuth()          → Firebase Auth state
   useConversations() → Real-time conversations list
   useMessages()      → Real-time messages for conversation
   usePresence()      → Real-time presence status
   useNotifications() → Foreground notification handler
   ```

3. **Service Layer**
   ```
   services/
   ├── chat.ts        → sendMessage, markRead, markDelivered
   ├── presence.ts    → updatePresence, setTyping, clearTyping
   ├── aiChat.ts      → AI-specific message handling
   ├── openai.ts      → Text transformations
   └── n8n.ts         → RAG integration webhooks
   ```

### Message Status Flow

```
1. Sent:      Set on Firestore write with deliveredTo: [senderId]
2. Delivered: Marked via markDelivered() when message arrives or app opens
3. Read:      Marked via markRead() when user opens chat (adds userId to readBy)
```

**Implementation**: Arrays in message documents:
```typescript
{
  text: "message",
  createdAt: timestamp,
  deliveredTo: ["user1"], // Initially sender
  readBy: []              // Initially empty
}
```

**Status Calculation** (from `utils/messageStatus.ts`):
- Read: `readBy.length > 1` (more than just sender)
- Delivered: `deliveredTo.length > 1` (more than just sender)
- Sent: Default state

---

## 4. Component Rendering Strategy

### Core UI Primitives

#### 1. GradientBackground
**Purpose**: Provides consistent dark background across all screens

```11:22:components/ui/GradientBackground.tsx
export default function GradientBackground({ children, style }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.background]}
      style={[styles.gradient, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0 }}
    >
      {children}
    </LinearGradient>
  );
}
```

**Key Points**:
- Uses `expo-linear-gradient` for consistent theming
- Single color (flat design) for Noir theme
- Wraps entire screen content

#### 2. GlassCard
**Purpose**: Elevated card component with border

```11:19:components/ui/GlassCard.tsx
export default function GlassCard({ children, intensity = 0, style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}
```

**Styling**:
```21:32:components/ui/GlassCard.tsx
const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.dark.secondary,
  },
});
```

**Usage**: Conversation items, input cards, form containers

### Screen Composition Pattern

```
GradientBackground (dark background)
  └── SafeAreaView (platform-specific insets)
      └── Screen-specific layout
          ├── Header
          ├── Content (FlatList / ScrollView)
          └── Footer (ChatInput)
```

### Chat Input Component

**Location**: `components/chat/ChatInput.tsx`

**Features**:
- Multi-line text input
- Send button with long-press gesture
- Transformation popover (Concise, Professionalize, Technicalize)
- Platform-specific keyboard handling

**Keyboard Handling**:
```170:184:components/chat/ChatInput.tsx
  // Only use KeyboardAvoidingView on native platforms
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 0 }}
      >
        {contentWrapper}
      </KeyboardAvoidingView>
    );
  }

  // Web and other platforms render directly
  return contentWrapper;
```

**Best Practice**: Conditional rendering based on platform prevents web layout issues

### Message Rendering

**Location**: `components/chat/Message.tsx`

**Layout Pattern**:
```
Current User Message (Right-aligned):
  Bubble with amber accent → Avatar

Other User Message (Left-aligned):
  Avatar → Bubble (secondary background)
  Sender name above
```

**Key Styles**:
- Max width: 75% of screen
- Avatar: 32x32 circular with initials
- Timestamp + status: Bottom right (current user only)
- Border accent: Amber glow for current user messages

---

## 5. Design System Implementation

### Color Palette (Noir + Amber)

**File**: `constants/Colors.ts`

```24:42:constants/Colors.ts
  dark: {
    text: '#F5F5F5',
    textSecondary: '#A1A1AA',
    background: '#0B0B0B',
    backgroundGradientStart: '#0B0B0B',
    backgroundGradientEnd: '#0B0B0B',
    tint: amberAccent,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: amberAccent,
    border: '#262626',
    secondary: '#111111',
    glass: 'rgba(255, 255, 255, 0.02)',
    glassLight: 'rgba(255, 255, 255, 0.04)',
    accentStart: amberAccent,
    accentEnd: amberAccentDark,
    glow: 'rgba(245, 158, 11, 0.22)',
  },
```

**Design Principles**:
- Deep black backgrounds (#0B0B0B)
- Amber accents (#F59E0B)
- Minimal contrast (2-4% opacity overlays)
- Flat design (no gradients/blur)

### Typography System

**File**: `styles/theme.ts`

```11:38:styles/theme.ts
  typography: {
    heading1: {
      fontSize: 32,
      fontWeight: '800' as const,
      fontFamily: 'Inter_800ExtraBold',
      letterSpacing: -1,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '700' as const,
      fontFamily: 'Inter_700Bold',
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
    },
    small: {
      fontSize: 13,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
    },
    semibold: {
      fontSize: 15,
      fontWeight: '600' as const,
      fontFamily: 'Inter_600SemiBold',
    },
  },
```

**Fonts Loaded** (from `app/_layout.tsx`):
- Inter_400Regular
- Inter_500Medium
- Inter_600SemiBold
- Inter_700Bold
- Inter_800ExtraBold

### Spacing System

```40:53:styles/theme.ts
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
```

**Usage**: Consistent spacing throughout app (8px gaps, 16px padding, 20px horizontal margins)

### Centralized Styling Strategy

**Pattern**: Extract styles from components to separate files

**Example**: `styles/components/chatInput.ts`

**Benefits**:
- Rapid iteration on visual design
- No need to hunt through component files
- Clear separation of concerns
- Easy to maintain consistency

---

## 6. Gesture Handling & Animations

### Swipe-to-Delete

**Component**: `components/conversation/SwipeableRow.tsx`

**Implementation**:
- Uses `Swipeable` from `react-native-gesture-handler`
- Red delete button reveals on swipe
- Smooth scale animation with interpolation
- Right threshold: 40px
- Overshoot disabled for precision

```17:23:components/conversation/SwipeableRow.tsx
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
```

### Long-Press Transformation Menu

**Component**: `components/chat/ChatInput.tsx`

**Features**:
- Long press on send button (400ms)
- Popover appears with transformation options
- Spring animations via Reanimated
- Tap-outside-to-dismiss

**Animation Pattern**:
```91:97:components/chat/ChatInput.tsx
  const popoverAnimatedStyle = useAnimatedStyle(() => ({
    opacity: popoverOpacity.value,
    transform: [
      { scale: popoverScale.value },
      { translateY: popoverY.value },
    ],
  }));
```

---

## 7. Platform-Specific Optimizations

### iOS vs Android vs Web

#### Keyboard Handling
- **iOS**: KeyboardAvoidingView with `behavior="padding"`
- **Android**: KeyboardAvoidingView without specific behavior
- **Web**: No KeyboardAvoidingView (browser handles it)

#### Safe Area Edges
- **iOS**: `['top', 'right']` for tabs (notch + home indicator)
- **iOS**: `['top']` for screens (status bar only)
- **Android**: Edge-to-edge enabled in `app.json`
- **Web**: No safe area handling needed

#### Notifications
- **iOS/Android**: Full foreground notification support
- **Web**: Skipped (notifications not supported)

**Implementation**:
```19:30:app/_layout.tsx
// Configure notification handler for foreground (iOS/Android only)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
```

---

## 8. Navigation Architecture

### Expo Router Setup

**File**: `app/_layout.tsx`

**Stack Configuration**:
```50:56:app/_layout.tsx
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="new-conversation" />
          <Stack.Screen name="+not-found" />
        </Stack>
```

**Navigation Flow**:
```
Auth Screen
  ↓ (on sign in)
Tabs Screen (Conversations List)
  ↓ (on conversation tap)
Chat Screen ([id] dynamic route)
  ↓ (on new chat button)
New Conversation Screen
  ↓ (on contact select)
Chat Screen (navigates to chat)
```

### Bottom Tabs

**File**: `app/(tabs)/_layout.tsx`

**Configuration**:
```8:36:app/(tabs)/_layout.tsx
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: Colors.dark.text,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} icon="💬" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} icon="👤" />
          ),
        }}
      />
    </Tabs>
```

**Styling**:
- Pill-shaped (borderTopLeftRadius: 20)
- Height: 72px
- Active state: Dark background (#1A1A1A)
- Icons: Emoji-based (💬, 👤)

---

## 9. Best Practices & Key Findings

### From Expo SDK 54 Documentation

1. **Safe Area Handling**
   - Always use `react-native-safe-area-context` (not built-in)
   - Wrap root with `SafeAreaProvider`
   - Use `edges` prop for granular control
   - Web platform handles safe areas automatically

2. **Performance**
   - Use `FlatList` for long lists (implemented in conversations)
   - Leverage `react-native-reanimated` for smooth animations
   - Implement `GestureHandlerRootView` at root for gesture support

3. **Cross-Platform**
   - Check `Platform.OS` for platform-specific code
   - Test on iOS, Android, and Web
   - Avoid components that don't work on web (like KeyboardAvoidingView)

4. **New Architecture**
   - Enabled via `newArchEnabled: true` in `app.json`
   - Provides performance improvements on native platforms
   - Uses precompiled React Native for iOS (faster builds)

### Design Best Practices

1. **Consistent Spacing**
   - Use design tokens (8px, 16px, 20px, 24px)
   - Apply consistently across screens
   - Horizontal padding: 20px for most screens

2. **Typography Hierarchy**
   - Heading1: 32px (Inter_800ExtraBold)
   - Heading2: 24px (Inter_700Bold)
   - Body: 15px (Inter_400Regular)
   - Small: 13px (Inter_400Regular)

3. **Touch Targets**
   - Minimum 44x44px for all interactive elements
   - Adequate spacing between touch targets
   - Visual feedback with `activeOpacity`

4. **Color Contrast**
   - Text: High contrast (#F5F5F5 on #0B0B0B)
   - Secondary text: #A1A1AA
   - Borders: Subtle (#262626)

---

## 10. Current Implementation Status

### ✅ Fully Implemented

- Safe area handling across all platforms
- Real-time messaging with Firestore
- Message status tracking (sent/delivered/read)
- Presence system (online/offline/typing)
- Foreground notifications
- Swipe-to-delete gestures
- AI conversation with OpenAI integration
- Text transformations (Concise, Professionalize, Technicalize)
- Dark theme with noir + amber aesthetic
- Centralized styling system
- Cross-platform support (iOS, Android, Web)

### 🔄 In Progress

- Style refinements using centralized system
- Additional AI tool calls (next steps, meeting notes)
- Tool output caching in Firestore

### 📋 Planned

- Backend messaging service
- Push notifications (background)
- Offline persistence beyond Firestore cache
- Deep analytics

---

## 11. Key Architectural Decisions

1. **No Global State Library**: Using Firestore + local state for simplicity
2. **File-Based Routing**: Expo Router provides type-safe navigation
3. **Service Layer Pattern**: Clean separation of business logic
4. **Hook-Based Data Fetching**: Real-time listeners via custom hooks
5. **Centralized Styling**: Rapid iteration on visual design
6. **Platform Checks**: Conditional rendering for cross-platform compatibility
7. **Safe Area Per Screen**: Granular control with `edges` prop
8. **Flat Design**: No gradients/blur for professional minimal aesthetic

---

## 12. Data Flow Summary

```
UI Layer (Screens/Components)
  ↓
Hook Layer (useAuth, useMessages, useConversations)
  ↓
Service Layer (chat.ts, presence.ts, aiChat.ts)
  ↓
Firebase Layer (Firestore + Auth)
  ↓
External APIs (OpenAI, n8n)
```

**Real-Time Updates**:
- Firestore `onSnapshot` listeners provide instant updates
- No manual polling or refresh needed
- Optimistic UI updates on user actions

---

## Conclusion

Comm's UI/UX architecture successfully implements modern React Native patterns with Expo SDK 54, providing a seamless cross-platform experience. The safe area handling strategy ensures content is never obscured by device UI elements, while the centralized styling system enables rapid visual iteration. The real-time data flow with Firestore provides instant updates without manual state management complexity.

The app demonstrates best practices for:
- ✅ Safe area handling on iOS, Android, and Web
- ✅ Platform-specific optimizations
- ✅ Gesture-based interactions
- ✅ Smooth animations with Reanimated
- ✅ Consistent design system
- ✅ Type-safe navigation with Expo Router
- ✅ Cross-platform compatibility

**Next Steps**: Continue refining the visual design using the centralized styling system, implement additional AI capabilities, and enhance offline support.

