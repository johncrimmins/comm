# **Comm**

Building Comm: A Cross-Platform Messaging App

---

### **MVP Requirements**

This is a hard gate. To pass the MVP checkpoint, you must have:

* One-on-one chat functionality  
* Real-time message delivery between 2+ users  
* Message persistence (survives app restarts)  
* Optimistic UI updates (messages appear instantly before server confirmation)  
* Online/offline status indicators  
* Message timestamps  
* User authentication (users have accounts/profiles)  
* Basic group chat functionality (3+ users in one conversation)  
* Message read receipts  
* Push notifications working (at least in foreground)  
* **Deployment**: Running on local emulator/simulator with deployed backend (TestFlight/APK/Expo Go if possible, but not required for MVP)

The MVP isn't about features—it's about proving your messaging infrastructure is solid. A simple chat app with reliable message delivery is worth more than a feature-rich app with messages that don't sync reliably.

### **Platform Requirements**

* **React Native with Expo** \- Must use Expo Go 

## **Core Messaging Infrastructure**

### **Essential Features**

Your messaging app needs one-on-one chat with real-time message delivery. Messages must persist locally—users should see their chat history even when offline. Support text messages with timestamps and read receipts.

Implement online/offline presence indicators. Show when users are typing. Handle message delivery states: sending, sent, delivered, read.

Include basic messaging of text \- other media like images does not need to be supported for MVP. Add display names but no need for profile pictures in the MVP.

Build group chat functionality supporting 3+ users.

### **Real-Time Messaging**

Every message should appear instantly for online recipients. When users go offline, messages queue and send when connectivity returns. 

Implement optimistic UI updates. When users send a message, it appears immediately in their chat, then updates with delivery confirmation. Support message persistence (survives app restarts).

### **Testing Scenarios**

We'll test with:

1. Two devices chatting in real-time  
2. One device going offline, receiving messages, then coming back online  
3. App force-quit and reopened to verify persistence  
4. Group chat with 3+ participants

## **Build Strategy**

**Start with Messages First:** Get basic messaging working end-to-end before anything else:

1. Send a text message from User A → appears on User B's device  
2. Messages persist locally (works offline)  
3. Messages sync on reconnect  
4. Handle app lifecycle (background/foreground)

Only after messaging is solid should you add other features.

**Build Vertically:** Finish one slice at a time. Don't have 10 half-working features.

