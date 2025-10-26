# Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend - React Native Expo"
        Auth[Auth Screens]
        Tabs[Tabs Navigation]
        NewConv[New Conversation Screen]
        ChatScreen[Chat Screen]
        UI[UI Components]
    end
    
    subgraph "Hooks Layer"
        useAuth[useAuth]
        useConversations[useConversations]
        useMessages[useMessages]
        useUsers[useUsers]
    end
    
    subgraph "Services Layer"
        ChatService[chat.ts]
        AuthService[auth.ts]
    end
    
    subgraph "Firebase SDK"
        Firestore[(Firestore)]
        Auth[Firebase Auth]
    end
    
    subgraph "Firestore Collections"
        Users[users/]
        Conversations[conversations/]
        Messages[conversations/{id}/messages/]
        State[conversations/{id}/state/state]
    end
    
    Auth --> Firestore
    Auth --> Auth
    ChatService --> Firestore
    useAuth --> AuthService
    useConversations --> Firestore
    useMessages --> Firestore
    useUsers --> Firestore
    
    Firestore --> Users
    Firestore --> Conversations
    Firestore --> Messages
    Firestore --> State
    
    Auth --> useAuth
    AuthService --> Auth
    ChatService --> useMessages
    ChatService --> useConversations
    
    UI --> ChatScreen
    UI --> NewConv
    ChatScreen --> useMessages
    NewConv --> ChatService
    NewConv --> useUsers
```

## Data Flow: Creating a New Chat

```mermaid
sequenceDiagram
    participant User
    participant NewConv as New Conversation Screen
    participant ChatService as chat.ts
    participant Firestore
    participant ChatScreen as Chat Screen
    participant useMessages as useMessages Hook
    
    User->>NewConv: Select contacts & type message
    NewConv->>ChatService: createOrFindConversation(participantIds)
    ChatService->>Firestore: Query existing conversations
    Firestore-->>ChatService: Return conversation or null
    alt Conversation exists
        ChatService-->>NewConv: Return existing conversationId
    else New conversation
        ChatService->>Firestore: Create conversation document
        Firestore-->>ChatService: Return conversationId
    end
    
    NewConv->>ChatService: sendMessage(conversationId, text, senderId)
    ChatService->>Firestore: Check if first message
    ChatService->>Firestore: Create message document with status='sent'
    Firestore-->>ChatService: Return messageId
    ChatService->>Firestore: Update conversation.updatedAt
    ChatService-->>NewConv: Return {messageId, shouldNavigate}
    
    NewConv->>ChatScreen: Navigate to /chat/[id]
    ChatScreen->>useMessages: Initialize hook with conversationId
    useMessages->>Firestore: Listen to messages subcollection
    Firestore-->>useMessages: Stream messages (onSnapshot)
    useMessages-->>ChatScreen: Render messages
```

## Data Flow: Chatting and Status Updates

```mermaid
sequenceDiagram
    participant Sender
    participant Receiver
    participant ChatService as chat.ts
    participant Firestore
    participant MessagesListener as Messages Listener
    participant StateListener as State Listener
    participant DeliveryUpdater as Delivery Status Updater
    
    Note over Sender: User A sends message
    Sender->>ChatService: sendMessage(conversationId, text, senderId)
    ChatService->>Firestore: Create message with status='sent'
    Firestore-->>ChatService: Return messageId
    
    Note over Firestore: Real-time listeners fire
    Firestore->>MessagesListener: onSnapshot fires for new message
    MessagesListener->>Sender: Update UI with message (status=sent)
    
    Note over Receiver: User B receives message
    Firestore->>MessagesListener: onSnapshot fires for new message
    MessagesListener->>Receiver: Update UI with message (status=sent)
    MessagesListener->>DeliveryUpdater: Trigger delivery update
    DeliveryUpdater->>Firestore: Update state.delivery.lastDeliveredAt[receiverId]
    
    Note over Firestore: State listener fires
    Firestore->>StateListener: onSnapshot fires for state update
    StateListener->>Sender: Check delivery.lastDeliveredAt
    StateListener->>Sender: Update message status to 'delivered'
    
    Note over Receiver: User B opens chat
    Receiver->>ChatService: markRead(conversationId, userId)
    ChatService->>Firestore: Update state.read.lastReadAt[userId]
    
    Note over Firestore: State listener fires
    Firestore->>StateListener: onSnapshot fires for state update
    StateListener->>Sender: Check read.lastReadAt
    StateListener->>Sender: Update message status to 'read'
```

## Message Status Flow

```mermaid
stateDiagram-v2
    [*] --> sent: Message sent to Firestore
    sent --> delivered: recipient opens app
    delivered --> read: recipient opens chat
    sent --> [*]: Error
    delivered --> [*]: Error
    read --> [*]: Error
    
    note right of sent
        Status set in message document
        when write succeeds
    end note
    
    note right of delivered
        State.delivery.lastDeliveredAt
        updated when recipient receives
    end note
    
    note right of read
        State.read.lastReadAt updated
        when recipient opens chat
    end note
```

