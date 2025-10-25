
## Relevant Files

- `lib/firebase/auth.ts` - Update to handle user profile creation in Firestore on signup/signin.
- `hooks/useUsers.ts` - New hook to fetch real users from Firestore.
- `app/new-conversation.tsx` - Integrate real users instead of mocks.
- `app/(tabs)/index.tsx` - Update to use real conversations from hook.
- `app/chat/[id].tsx` - Ensure uses real messages, remove any mocks.
- `services/chat.ts` - May need minor updates if participant handling changes.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `useUsers.ts` and `useUsers.test.ts` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Remove all mock data from UI components
  - [x] 1.1 In app/new-conversation.tsx, remove MOCK_USERS array and RECENTLY_CHATTED_IDS constant.
  - [x] 1.2 In app/(tabs)/index.tsx, remove MOCK_CONVERSATIONS array and update to use useConversations hook instead of useState.
  - [x] 1.3 In app/chat/[id].tsx, remove MOCK_CONVERSATIONS_DATA object and getConversationData function; confirm it uses useMessages hook.
  - [x] 1.4 Grep the codebase for any remaining 'mock' references and remove them if related to user/conversation data.

- [ ] 2.0 Implement user profile creation in Firestore
  - [x] 2.1 In lib/firebase/auth.ts, after successful signUp, add code to create a Firestore document in /users/{uid} with name derived from email (e.g., email.split('@')[0]), status: 'online', and a random avatarColor.
  - [x] 2.2 Similarly, on signIn, check if /users/{uid} exists; if not, create it with the same fields.
  - [x] 2.3 Use setDoc with merge: true to avoid overwriting existing data.
  - [x] 2.4 Define a helper function for generating random avatar colors from a predefined palette.

- [ ] 3.0 Create hook for fetching real users
  - [x] 3.1 Create new file hooks/useUsers.ts.
  - [x] 3.2 Implement useUsers hook using useState and useEffect with onSnapshot on collection(db, 'users').
  - [x] 3.3 Map snapshot docs to User type { id: string, name: string, status: string, avatarColor: string }.
  - [x] 3.4 Add proper unsubscribe on cleanup.

- [ ] 4.0 Integrate real users into new conversation screen
  - [x] 4.1 In app/new-conversation.tsx, import and use useUsers hook to get allUsers.
  - [x] 4.2 Update displayedUsers memo to filter allUsers (exclude current user via useAuthUser), and apply searchQuery filter.
  - [x] 4.3 For initial display (no search), show all users or limit to a few; no need for 'recently chatted' yet.
  - [x] 4.4 Ensure handleSelectContact and other functions work with real User type.
  - [x] 4.5 Test that selectedContacts use real ids for createConversationLocal.

- [ ] 5.0 Update conversation list and chat screens to use real data
  - [x] 5.1 In app/(tabs)/index.tsx, confirm conversations come from useConversations hook, which reads from SQLite.
  - [x] 5.2 In app/chat/[id].tsx, ensure messages and other data come from useMessages hook.
  - [x] 5.3 Verify that with real users, creating a conversation and sending messages works end-to-end for testing steps 1-5.
  - [x] 5.4 Add any necessary type alignments between User and existing models.
