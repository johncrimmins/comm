# Chat Screen Refactoring Plan

## Current State Analysis

**File:** `app/chat/[id].tsx` (319 lines)

### Current Responsibilities
The chat screen currently handles:
1. **Message Display** - Fetching and rendering messages
2. **Input Management** - Text input state and send functionality
3. **Typing Indicators** - Set/clear typing status with timeout logic
4. **Presence Updates** - Mark read on open, update presence on foreground
5. **Notifications** - Initialize for other conversations
6. **UI Rendering** - Header, message list, input area

### Issues Identified
- Single component doing too much (violates Single Responsibility Principle)
- Mixed concerns: UI + business logic + side effects
- Difficult to test individual features
- Hard to reuse logic in other contexts
- Complex state management with multiple refs and effects

---

## Refactoring Approaches

### Approach 1: Extract Custom Hooks (Recommended - Gradual)

**Strategy:** Extract business logic into custom hooks while keeping the component structure similar.

#### Hooks to Create:

1. **`useChatInput`** - Handles input state and typing indicators
   ```typescript
   // hooks/useChatInput.ts
   export function useChatInput(conversationId: string, userId: string) {
     const [inputText, setInputText] = useState('');
     const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
     
     const handleInputChange = (text: string) => {
       setInputText(text);
       // typing logic here
     };
     
     const handleSend = async () => {
       // send logic here
     };
     
     return { inputText, handleInputChange, handleSend };
   }
   ```

2. **`useChatPresence`** - Handles presence and read receipts
   ```typescript
   // hooks/useChatPresence.ts
   export function useChatPresence(conversationId: string, userId: string) {
     useEffect(() => {
       if (!conversationId || !userId) return;
       markRead(conversationId, userId).catch(() => {});
       updatePresence(userId).catch(() => {});
     }, [conversationId, userId]);
     
     // AppState listener here
   }
   ```

3. **`useChatMessages`** - Handles message transformation and display
   ```typescript
   // hooks/useChatMessages.ts
   export function useChatMessages(conversationId: string, userId: string) {
     const messagesFromFirestore = useMessages(conversationId);
     const [messages, setMessages] = useState<MessageType[]>([]);
     
     useEffect(() => {
       // transform messages here
     }, [messagesFromFirestore, userId]);
     
     return messages;
   }
   ```

#### Implementation Steps:
1. Create `hooks/useChatInput.ts` - Extract lines 41-42, 91-103, 105-127, 129-139
2. Create `hooks/useChatPresence.ts` - Extract lines 72-89
3. Create `hooks/useChatMessages.ts` - Extract lines 40, 52-69
4. Update `app/chat/[id].tsx` to use these hooks
5. Test each hook independently

#### Pros:
- ✅ Non-breaking - component structure stays similar
- ✅ Easy to test hooks in isolation
- ✅ Reusable logic across components
- ✅ Gradual migration - can do one hook at a time
- ✅ Clear separation of concerns

#### Cons:
- ⚠️ Still multiple hooks in one component
- ⚠️ Component file still ~200 lines

---

### Approach 2: Component Extraction (Medium Complexity)

**Strategy:** Split the screen into smaller, focused components.

#### Components to Create:

1. **`ChatHeader`** - Header with back button, title, presence, AI button
   ```typescript
   // components/chat/ChatHeader.tsx
   export function ChatHeader({ 
     onBack, 
     title, 
     presence, 
     onAIClick 
   }: ChatHeaderProps) {
     return (
       <View style={styles.header}>
         {/* header content */}
       </View>
     );
   }
   ```

2. **`ChatInput`** - Input area with text field and send button
   ```typescript
   // components/chat/ChatInput.tsx
   export function ChatInput({ 
     inputText, 
     onChangeText, 
     onSend, 
     disabled 
   }: ChatInputProps) {
     return (
       <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
         {/* input UI */}
       </KeyboardAvoidingView>
     );
   }
   ```

3. **`ChatMessages`** - Message list
   ```typescript
   // components/chat/ChatMessages.tsx
   export function ChatMessages({ 
     messages, 
     isGroupChat, 
     flatListRef 
   }: ChatMessagesProps) {
     return (
       <FlatList
         ref={flatListRef}
         data={messages}
         renderItem={renderMessage}
       />
     );
   }
   ```

#### Implementation Steps:
1. Create `components/chat/ChatHeader.tsx` - Extract lines 155-174 + styles
2. Create `components/chat/ChatInput.tsx` - Extract lines 186-217 + styles
3. Create `components/chat/ChatMessages.tsx` - Extract lines 176-184 + renderMessage
4. Update `app/chat/[id].tsx` to compose these components
5. Add props interfaces for each component

#### Pros:
- ✅ Highly reusable components
- ✅ Easier to style/test individual parts
- ✅ Clear component boundaries
- ✅ Main file reduced to ~150 lines
- ✅ Each component <100 lines

#### Cons:
- ⚠️ More files to manage
- ⚠️ Props drilling potential
- ⚠️ Need to pass refs/callbacks

---

### Approach 3: Hybrid - Hooks + Component Extraction (Most Complete)

**Strategy:** Combine both approaches - extract hooks for logic AND components for UI.

#### Structure:
```
app/chat/[id].tsx (50-80 lines)
├── components/chat/
│   ├── ChatHeader.tsx
│   ├── ChatInput.tsx
│   └── ChatMessages.tsx
└── hooks/
    ├── useChatInput.ts
    ├── useChatPresence.ts
    └── useChatMessages.ts
```

#### Implementation Steps:
1. **Phase 1:** Extract hooks (Approach 1)
   - Create `useChatInput`, `useChatPresence`, `useChatMessages`
   - Update component to use hooks
   - Test logic extraction
   
2. **Phase 2:** Extract components (Approach 2)
   - Create `ChatHeader`, `ChatInput`, `ChatMessages`
   - Wire up props
   - Test UI extraction
   
3. **Phase 3:** Polish
   - Optimize prop passing
   - Add proper TypeScript interfaces
   - Add component documentation

#### Pros:
- ✅ Best separation of concerns
- ✅ Highly testable (hooks + components)
- ✅ Very reusable
- ✅ Main file becomes orchestration only
- ✅ Follows React best practices

#### Cons:
- ⚠️ Most complex to implement
- ⚠️ More files to manage
- ⚠️ Requires careful prop design

---

## Recommended Implementation Order

### Phase 1: Start with Approach 1 (Extract Hooks)
- Quick wins with clear separation
- Non-breaking changes
- Can stop here if satisfied

### Phase 2: Add Approach 2 (Extract Components)
- UI components are independent
- Can be done incrementally
- Benefits compound with Phase 1

### Phase 3: Refine (Approach 3 completed)
- Document component interfaces
- Add error boundaries
- Optimize re-renders

---

## Implementation Checklist

### Approach 1 (Hooks)
- [ ] Create `hooks/useChatInput.ts`
- [ ] Create `hooks/useChatPresence.ts`
- [ ] Create `hooks/useChatMessages.ts`
- [ ] Update `app/chat/[id].tsx` imports
- [ ] Replace inline logic with hook calls
- [ ] Test typing indicators
- [ ] Test send functionality
- [ ] Test presence updates

### Approach 2 (Components)
- [ ] Create `components/chat/ChatHeader.tsx`
- [ ] Create `components/chat/ChatInput.tsx`
- [ ] Create `components/chat/ChatMessages.tsx`
- [ ] Define TypeScript interfaces
- [ ] Extract styles to each component
- [ ] Update `app/chat/[id].tsx` to use components
- [ ] Test UI rendering
- [ ] Test interactions

### Both Approaches (Complete)
- [ ] Verify all existing functionality works
- [ ] Run linter
- [ ] Test on iOS/Android/Web
- [ ] Update documentation
- [ ] Commit changes

---

## Risks & Mitigation

### Risk: Breaking existing functionality
**Mitigation:** 
- Implement one hook/component at a time
- Test after each extraction
- Keep backups of working state

### Risk: Props drilling
**Mitigation:**
- Use TypeScript interfaces for clear contracts
- Consider context if props get too deep
- Keep components small and focused

### Risk: Over-engineering
**Mitigation:**
- Start with Approach 1 only
- Evaluate if more extraction is needed
- Don't extract if complexity isn't justified

---

## Expected Outcomes

### Before Refactoring
- **File:** `app/chat/[id].tsx` - 319 lines
- **Responsibilities:** 6+ concerns mixed together
- **Testability:** Difficult to test in isolation
- **Reusability:** Low - logic tied to component

### After Approach 1 (Hooks)
- **Files:** `app/chat/[id].tsx` (~200 lines) + 3 hooks (~50 lines each)
- **Responsibilities:** Separated into hooks
- **Testability:** Hooks can be tested independently
- **Reusability:** Hooks reusable in other contexts

### After Approach 2 (Components)
- **Files:** `app/chat/[id].tsx` (~150 lines) + 3 components (~60 lines each)
- **Responsibilities:** UI and logic separated
- **Testability:** Components testable in Storybook-like setup
- **Reusability:** Components reusable in other screens

### After Both (Complete)
- **Files:** `app/chat/[id].tsx` (~80 lines) + 3 hooks + 3 components
- **Responsibilities:** Clean separation of concerns
- **Testability:** Both hooks and components easily testable
- **Reusability:** Highly reusable architecture

---

## Timeline Estimate

- **Approach 1 (Hooks only):** 2-3 hours
- **Approach 2 (Components only):** 2-3 hours
- **Both Approaches:** 4-5 hours total

---

## Next Steps

1. Review this plan
2. Choose starting approach (recommend Approach 1)
3. Implement incrementally
4. Test after each change
5. Move to next approach if needed

