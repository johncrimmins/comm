// Introduction/Overview
## Introduction/Overview

This feature removes all mock data from the app and replaces it with real user data from Firebase Auth and Firestore, making signed-up users visible as contacts on the new conversation screen. This enables developers to test real messaging flows up to step 5 of tasks-prd-epic-1-messaging-core.md (e.g., auth, local-first conversations, messaging, and UI hooks) without mocks. The goal is to prepare the app for real testing while keeping changes minimal and aligned with existing implementations.

// Goals
## Goals

- Eliminate all mock user and conversation data to enable real testing.
- Fetch and display actual signed-up users from Firestore for contact selection.
- Ensure the app can validate steps 1-5 of the tasks file (Firebase init, SQLite, sync, services, hooks/UI) using real data.
- Maintain current UI and functionality without additions.

// User Stories
## User Stories

- As a developer testing the app, I want to see real signed-up users in the contacts list so I can start conversations with actual accounts.
- As a developer, I want mock data removed so that all flows (e.g., sending messages via local-first SQLite and sync) use real data for validation.

// Functional Requirements
## Functional Requirements

1. Remove mock arrays (e.g., MOCK_USERS, MOCK_CONVERSATIONS) from app/new-conversation.tsx, app/(tabs)/index.tsx, and app/chat/[id].tsx.
2. On user signup/signin, create/update a simple user document in Firestore /users/{uid} with basic fields like name (derived from email) and status.
3. Create a hook (e.g., useUsers.ts) to fetch all users from Firestore /users collection via onSnapshot for real-time updates.
4. Integrate the hook into app/new-conversation.tsx to display and filter real users instead of mocks; exclude the current user.
5. Update app/(tabs)/index.tsx to use useConversations hook for real conversation lists.
6. Ensure app/chat/[id].tsx uses useMessages hook for real data, removing any remaining mock functions.

// Non-Goals (Out of Scope)
## Non-Goals (Out of Scope)

- No changes to UI/design (keep current chip input, list, avatars as-is).
- No advanced features like pagination, privacy controls, or real-time status beyond basics.
- Ignore anything from prd.md or overview.md not covered in tasks steps 1-5 (e.g., no push notifications, media, or full offline reconciliation).
- No edge case handling (e.g., no users available, duplicates).
- No implementation beyond validation of existing steps 1-5.

// Design Considerations (Optional)
## Design Considerations

Keep the existing UI unchanged: use the current EditableChipInput for selection, FlatList for display, and avatar rendering based on name initials and color.

// Technical Considerations (Optional)
## Technical Considerations

- Use existing Firebase setup (lib/firebase/*) for Auth and Firestore.
- Align with SQLite-first patterns from tasks (e.g., hooks read from SQLite where applicable).
- Fetch users client-side via Firestore query; no Admin SDK needed for MVP testing.

// Success Metrics
## Success Metrics

- Developers can sign up multiple accounts, see each other in contacts, and test messaging flows from steps 1-5 without mocks.
- Manual testing confirms no crashes and basic functionality works.

// Open Questions
## Open Questions

None at this time, as scope is limited to basics for testing steps 1-5.
