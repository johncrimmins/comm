# Overview

**Comm** is a mobile messaging app built with Expo React Native and TypeScript, designed for cross-platform mobile development (iOS, Android, and Web). The app features a clean, WhatsApp-inspired UI with authentication screens and will include chat functionality. It uses Expo Router for file-based navigation and implements a modern component architecture with theming support (light/dark mode), following Expo's best practices for universal app development.

# Recent Changes

**October 23, 2025**: Superhuman-style redesign complete
- Implemented dark, premium, AI-native aesthetic across all screens
- Installed Inter font family (400, 500, 600, 700, 800 weights)
- Updated color palette with deep indigo gradients (#0A0A0F → #1A0F2E)
- Added violet-pink accent gradient (#C084FC → #9333EA)
- Created reusable glassmorphic UI components (GradientBackground, GlassCard, GradientButton)
- Redesigned Auth screen with "comms + context at the speed of thought" hero (all lowercase)
- Redesigned Conversation List with glassmorphic cards and "new" button
- Redesigned Chat screen with glassy message bubbles and AI button
- Redesigned New Conversation screen with multi-select for individual/group chats
- Removed separate New Group page - now handled by New Conversation multi-select
- Applied Inter fonts, lowercase copy, and smooth animations throughout

**October 23, 2025**: Directory structure reorganization
- Reorganized component folders to follow naming conventions
- Renamed `components/conversations/` to `components/conversation/`
- Renamed `MessageBubble` component to `Message` for clarity
- Moved `/ui` folder into `/components/ui` for better organization
- Removed Settings/Explore tab - app now has single Chats tab as default
- Updated all import statements across the application
- Maintained consistent file-based routing structure in `app/` directory

**October 23, 2025**: New Group screen implementation
- Created New Group screen at `app/new-group.tsx` with multi-select functionality
- Implemented checkbox-based user selection with visual feedback
- Added optional group name input field
- Built smart "Create Group" button that enables only when users are selected
- Displayed selected users count in header subtitle
- Added search functionality to filter contacts
- Used consistent WhatsApp-inspired design with colored avatars

**October 23, 2025**: Chat and New Conversation screens
- Built chat screen at `app/chat/[id].tsx` with dynamic conversation loading
- Created MessageBubble component for left/right aligned messages
- Implemented message input with send functionality
- Added mock conversation data for 8 different users
- Built new conversation screen at `app/new-conversation.tsx` with user list
- Fixed dynamic routing to properly load different conversations by id
- Added useEffect to update messages when switching conversations

**October 23, 2025**: Conversation List screen implementation
- Built conversation list screen at `app/(tabs)/index.tsx` with WhatsApp-inspired design
- Created reusable `ConversationItem` component with avatars, timestamps, and unread states
- Implemented FlatList with mock conversation data (4 sample conversations)
- Added empty state with "Start Chatting" prompt and button
- Included "+" button in header for new conversations and Logout button in footer
- Configured as default screen after authentication with single-tab layout

**October 23, 2025**: Initial authentication screen implementation
- Created beautiful auth screen at `app/(auth)/index.tsx` with WhatsApp-inspired design
- Implemented Sign In/Sign Up toggle with conditional form fields
- Added email and password validation with inline error messages
- Configured loading states with ActivityIndicator
- Updated color theme to WhatsApp green (#25D366) for messaging app aesthetic
- Set up Expo development workflow with web preview on port 5000

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Expo SDK 54 with React Native 0.81.4 and React 19.1.0

**Navigation Pattern**: File-based routing using Expo Router (~6.0.7)
- Routes are organized in the `/app` directory
- Uses route groups: `(auth)` for authentication flows and `(tabs)` for main tabbed navigation
- Stack navigator at root level with nested tab navigator
- Typed routes enabled for type-safe navigation

**UI Component Structure**:
- Custom themed components (`ThemedText`, `ThemedView`) that automatically adapt to light/dark mode
- Reusable UI components in `/components` directory
- Platform-specific implementations (`.ios.tsx` for iOS, fallback `.tsx` for Android/Web)
- Icon system using SF Symbols on iOS and Material Icons on other platforms

**Theming System**:
- Centralized color definitions in `constants/Colors.ts`
- Separate color schemes for light and dark modes
- Custom hooks (`useColorScheme`, `useThemeColor`) for theme-aware components
- WhatsApp-inspired color palette (green tint: #25D366)

**Animations and Interactions**:
- React Native Reanimated (~4.1.0) for performant animations
- Gesture handling via React Native Gesture Handler (~2.28.0)
- Haptic feedback on iOS for tactile user interactions
- Parallax scroll views for engaging header animations

**Form Handling**:
- Local state management with React hooks
- Client-side validation for email and password fields
- Error state management per form field

## Authentication Architecture

**Current Implementation**: Local form-based authentication UI
- Sign in and sign up modes
- Email/password validation
- Display name collection for new users
- No backend integration currently implemented (forms are UI-only)

**Future Integration Points**:
- Backend API calls can be added to handle actual authentication
- Token storage would need to be implemented
- Session management hooks could be added

## Cross-Platform Strategy

**Platform Support**: iOS, Android, and Web via Metro bundler

**Platform-Specific Code**:
- Conditional imports using `.ios.tsx` and `.web.ts` extensions
- Platform checks using `Platform.OS` and `process.env.EXPO_OS`
- Expo-specific platform optimizations (edge-to-edge on Android, tab blur on iOS)

**Responsive Design**:
- Safe area context for handling device notches and system UI
- KeyboardAvoidingView for form screens
- ScrollView-based layouts for content overflow handling

## Asset Management

**Images and Icons**:
- Expo Image (~3.0.8) for optimized image loading
- Expo Symbols for SF Symbols on iOS
- Expo Vector Icons for Material Icons fallback
- Custom icon mapping system for cross-platform consistency

**Fonts**:
- Custom font loading via Expo Font (~14.0.8)
- SpaceMono font included in assets
- Async font loading in development mode

## Development Tooling

**Type Safety**: TypeScript with strict mode enabled
- Path aliases configured (`@/*` maps to project root)
- Expo type definitions for typed routes
- React 19 type definitions

**Code Quality**:
- ESLint with Expo configuration
- Flat config format for ESLint 9
- Jest configured for testing with jest-expo preset

**Build System**:
- Metro bundler for all platforms
- Static web output configuration
- Expo's new architecture enabled for improved performance

# External Dependencies

## Core Frameworks
- **Expo SDK 54**: Complete framework for React Native development, providing native modules and services
- **React Native 0.81.4**: Core mobile framework
- **React 19.1.0**: UI library with latest concurrent features

## Navigation
- **expo-router (~6.0.7)**: File-based routing system
- **@react-navigation/native (^7.1.6)**: Navigation primitives
- **@react-navigation/bottom-tabs (^7.3.10)**: Tab navigation implementation
- **react-native-screens (~4.16.0)**: Native screen optimization
- **react-native-safe-area-context (~5.6.0)**: Safe area handling

## UI and Interactions
- **react-native-reanimated (~4.1.0)**: High-performance animations
- **react-native-gesture-handler (~2.28.0)**: Touch gesture system
- **expo-blur (~15.0.7)**: Native blur effects (iOS tab bar)
- **expo-haptics (~15.0.7)**: Haptic feedback
- **expo-symbols (~1.0.7)**: SF Symbols support for iOS

## Platform Services
- **expo-web-browser (~15.0.7)**: In-app browser for external links
- **expo-linking (~8.0.8)**: Deep linking and URL schemes
- **expo-status-bar (~3.0.8)**: Status bar styling
- **expo-system-ui (~6.0.7)**: System UI configuration
- **expo-splash-screen (~31.0.10)**: Splash screen management

## Development Tools
- **TypeScript (~5.9.2)**: Static type checking
- **Jest (^29.2.1)**: Testing framework
- **ESLint (^9.25.0)**: Code linting with Expo configuration

## Asset and Resource Management
- **expo-font (~14.0.8)**: Custom font loading
- **expo-image (~3.0.8)**: Optimized image component
- **@expo/vector-icons (^15.0.2)**: Icon library

## Web Support
- **react-native-web (^0.21.0)**: React Native for web browsers
- **react-dom (19.1.0)**: DOM rendering for web platform

## Notes
- No backend services currently integrated (authentication is UI-only)
- No database configured (forms do not persist data)
- No state management library (using React hooks for local state)
- Ready for backend integration when needed