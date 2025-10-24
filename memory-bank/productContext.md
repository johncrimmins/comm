# Product Context

## Why this project exists
Deliver a minimal, responsive chat experience that authenticates users and enables real-time messaging backed by Firebase, replacing ephemeral local mocks with production-ready services.

## Problems it solves
- Mocked data lacks persistence and real-time updates.
- Authentication must be reliable and simple to integrate with the existing UI.
- The project needs a clean boundary between UI and data services for maintainability and reversibility.

## How it should work
- Users sign in or sign up with email/password from `app/(auth)/index.tsx`.
- On success, the app routes to `/(tabs)` and users can open a conversation.
- The chat screen at `app/chat/[id].tsx` subscribes to Firestore messages for the given conversation id and renders them in order.
- Sending a message writes to Firestore with a server timestamp; the message appears immediately via the subscription.

## User experience goals
- Keep the current visuals and interactions unchanged during Phase 1.
- Ensure fast, reliable sign-in and near-instant message updates.
- Avoid platform-specific behaviors or styling churn during this phase.

## Scope boundaries
- Out of scope: offline persistence, Android-specific layout/keyboard handling, styling/design system migrations, and navigation auth gates.

## Minimum viable data shape
```
conversations/{conversationId}
  messages/{messageId}
    text: string
    senderId: string
    createdAt: Timestamp
```
