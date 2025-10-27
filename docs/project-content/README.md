# Comm - Cross-Platform Messaging App with AI Features

**Comm** is a production-quality messaging application built with React Native and Expo, featuring real-time messaging, offline support, group chat functionality, and AI-powered conversation assistance. Inspired by WhatsApp's reliability and speed, Comm combines robust messaging infrastructure with intelligent AI features that enhance communication productivity.

## 🌟 Overview

Comm delivers instant, reliable messaging across iOS, Android, and Web platforms with a single codebase. Built with Firebase Firestore for real-time synchronization, the app features:

- **Real-time messaging** with sub-200ms delivery
- **Offline-first architecture** with automatic sync
- **Group chat** support for 3+ participants
- **AI assistant** (Comms) for conversation analysis and assistance
- **Message transformations** powered by OpenAI GPT-4o-mini
- **Professional design** with TalkTime-inspired UI

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Emulator, or physical device with Expo Go app

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd comm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   EXPO_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device**
   - Open Expo Go app on your iOS/Android device
   - Scan the QR code displayed in terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📱 Platform Support

Comm runs seamlessly on:
- **iOS** - Native performance with Expo Go
- **Android** - Full feature parity
- **Web** - Browser-based messaging with fallback styles

## ✨ Core Features

### Real-Time Messaging

- **Instant delivery**: Messages appear in real-time for all online users
- **Optimistic UI**: Messages display immediately before server confirmation
- **Message status**: Visual indicators for sent, delivered, and read states
- **Typing indicators**: See when others are typing
- **Message timestamps**: Displayed on all messages

### Offline Support

- **Auto-queue**: Messages queue locally when offline
- **Auto-sync**: Messages send automatically when connection restored
- **Offline persistence**: Full chat history survives app restarts
- **Connection indicators**: Visual feedback for connection status

### Group Chat

- **Multi-participant**: Support for 3+ users in one conversation
- **Message attribution**: Clear sender names and avatars
- **Presence**: Shows "X online · Y members" in group chats
- **Group presence**: Real-time online status for all participants

### AI Features

#### Chat with Comms (AI Assistant)

A dedicated AI conversation that helps users:
- **Summarize conversations**: Ask "summarize this conversation" to get key points
- **Extract action items**: Request "what are the action items?" to identify tasks
- **Track decisions**: Query "what decisions did we make?" to surface agreements
- **Natural language**: Uses conversational keywords to understand requests

#### Message Transformations

Long-press the send button to transform messages:
- **Concise**: Makes messages shorter while preserving meaning
- **Professionalize**: Rewrites with professional tone
- **Technicalize**: Adds precise technical terminology

#### Advanced Capability: Proactive AI Assistant

The AI proactively helps users manage conversations through:
- Conversation analysis via RAG (Retrieval-Augmented Generation)
- Real-time summarization of long threads
- Action item extraction from group discussions
- Decision tracking for team coordination

### Image Support

- **Send images**: Attach photos from device library
- **Image preview**: See attached images before sending
- **Inline display**: Images render in message bubbles
- **Firebase Storage**: Secure cloud storage for all images

### User Experience

- **Modern UI**: Pure black backgrounds with warm amber accents
- **Smooth animations**: 60 FPS scrolling through 1000+ messages
- **Swipe gestures**: Swipe to delete conversations
- **Keyboard handling**: Optimized input experience across platforms
- **Safe areas**: Proper handling of notches and system UI

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React Native 0.81 with Expo SDK 54
- **Routing**: Expo Router v6 with file-based navigation
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Real-time**: Firestore listeners for live updates
- **AI**: OpenAI GPT-4o-mini with function calling
- **RAG**: n8n webhooks for conversation analysis
- **State**: React hooks + Firestore subscriptions

### Key Services

- **`services/chat.ts`**: Message sending, delivery tracking, read receipts
- **`services/aiChat.ts`**: AI conversation orchestration
- **`services/openai.ts`**: OpenAI API integration with tool calling
- **`services/n8n.ts`**: RAG pipeline via n8n webhooks
- **`services/storage.ts`**: Firebase Storage for images
- **`services/presence.ts`**: Online/offline and typing status

### Data Flow

```
User Types → ChatInput → Chat Screen → sendMessage()
                                          ↓
                                    Firestore write
                                          ↓
                                    onSnapshot listener
                                          ↓
                                    UI updates in real-time
```

## 📊 Firebase Structure

### Collections

```
users/
  {userId}/
    name: string
    email: string
    lastSeen: Timestamp
    currentlyTypingIn: string | null
    avatarColor: string

conversations/
  {conversationId}/
    participantIds: string[]
    title?: string
    updatedAt: Timestamp
    messages/
      {messageId}/
        text: string
        imageUrl?: string
        senderId: string
        createdAt: Timestamp
        deliveredTo: string[]
        readBy: string[]
```

## 🎨 Design System

### Color Palette

- **Background**: `#000000` (Pure black)
- **Accent**: `#F5A623` (Warm amber)
- **Text**: `#FFFFFF` (Pure white)
- **Read text**: `#AAAAAA` (Gray)

### Typography

- **Display names**: 15px, semibold
- **Message text**: 15px, regular
- **Timestamps**: 11px, regular
- **Input placeholder**: 15px, secondary color

### Components

- **GlassCard**: Flat surface container with borders
- **GradientBackground**: Black background wrapper
- **GradientButton**: Amber flat button
- **ChatInput**: Reusable input with transformations
- **Message**: Message bubble with status

## 🔐 Security

- **Firebase Auth**: Secure email/password authentication
- **Firestore Rules**: User-scoped data access
- **API Keys**: Environment variables for sensitive data
- **Storage Rules**: User-uploaded content validation

## 🧪 Testing Scenarios

### Real-Time Messaging
1. Two devices: Send messages between devices in real-time
2. Quick send: Send 20+ messages rapidly without lag
3. Offline: Go offline, send messages, come online → messages deliver

### Offline Support
1. Send while offline: Messages queue locally
2. App restart: Force quit, reopen → chat history intact
3. Network drop: Disconnect for 30s+ → auto-reconnect

### Group Chat
1. 3+ participants: Multiple users messaging simultaneously
2. Presence: See "X online · Y members" updating in real-time
3. Attribution: Clear sender names and avatars

### App Lifecycle
1. Background: App background → messages still receive
2. Foreground: Come back → messages sync instantly
3. Force quit: Kill app → reopen → full history preserved

## 📚 Documentation

### Feature Guides

- [AI Features Implementation](./ai-features.md) - Comprehensive guide to AI capabilities
- [Message Transformations](./message-transformations.md) - How message editing works
- [Image Support](./image-support.md) - Media attachment implementation
- [Offline Support](./offline-support.md) - Offline-first architecture
- [Real-Time Messaging](./real-time-messaging.md) - Live sync implementation

### Architecture

- [System Patterns](../memory-bank/systemPatterns.md) - Architecture decisions
- [Technical Context](../memory-bank/techContext.md) - Tech stack details
- [Progress Tracking](../memory-bank/progress.md) - Feature status

## 🛠️ Development

### Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
npm test           # Run Jest tests
npm run lint       # Run ESLint
```

### Code Organization

```
app/               # File-based routing (Expo Router)
  (auth)/          # Authentication screens
  (tabs)/           # Tab navigation screens
  chat/[id].tsx     # Chat screen
components/         # Reusable UI components
hooks/              # Custom React hooks
services/           # Business logic & API calls
lib/                # External library wrappers
styles/             # Styling system
types/              # TypeScript types
```

### Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and test thoroughly
3. Commit with clear messages: `git commit -m "Add amazing feature"`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create pull request

## 📈 Performance

- **Launch time**: <2 seconds to chat screen
- **Message delivery**: Sub-200ms on good network
- **Scrolling**: Smooth 60 FPS through 1000+ messages
- **Offline sync**: <1 second sync time after reconnection
- **Image upload**: Optimized compression and caching

## 🌐 Deployment

### Expo Go

1. Run `npx expo start`
2. Scan QR code with Expo Go app
3. App loads instantly

### Production Build

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 🤝 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review code comments in `services/` and `hooks/`

## 📄 License

This project is part of a learning initiative. See LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Powered by [Firebase](https://firebase.google.com)
- AI features by [OpenAI](https://openai.com)
- Inspired by WhatsApp's elegant simplicity

---

**Comm** - Intelligent messaging for the modern world.
