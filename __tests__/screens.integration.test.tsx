import React from 'react';
import { render } from '@testing-library/react-native';
import ConversationListScreen from '@/app/(tabs)/index';
import NewConversationScreen from '@/app/new-conversation';
import ChatScreen from '@/app/chat/[id]';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'conv1' }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  onSnapshot: jest.fn((_q: any, cb: (snap: any) => void) => {
    cb({ docs: [] });
    return () => {};
  }),
}));

jest.mock('@/lib/firebase/db', () => ({ db: {} }));

jest.mock('@/hooks/useAuth', () => ({ useAuthUser: () => ({ uid: 'me', email: 'me@example.com' }) }));

jest.mock('@/hooks/useConversations', () => ({ useConversations: () => [] }));

jest.mock('@/hooks/useMessages', () => ({ useMessages: () => [] }));

jest.mock('@/lib/sqlite', () => ({ isSomeoneTyping: async () => false, isAnyParticipantOnline: async () => true }));

describe('screens basic render', () => {
  it('renders conversation list', () => {
    const { getByText } = render(<ConversationListScreen />);
    expect(getByText('messages')).toBeTruthy();
  });

  it('renders new conversation', () => {
    const { getByText } = render(<NewConversationScreen />);
    expect(getByText('new message')).toBeTruthy();
  });

  it('renders chat screen', () => {
    const { getByText } = render(<ChatScreen />);
    expect(getByText('chat')).toBeTruthy();
  });
});
