import { act, renderHook } from '@testing-library/react-hooks';
import { useUsers } from '@/hooks/useUsers';

jest.mock('firebase/firestore', () => {
  const listeners: Array<(snap: any) => void> = [];
  return {
    collection: jest.fn(() => ({})),
    query: jest.fn((_c: any) => ({})),
    onSnapshot: jest.fn((_q: any, cb: (snap: any) => void) => {
      listeners.push(cb);
      // Immediately emit one snapshot
      cb({
        docs: [
          { id: 'u1', data: () => ({ name: 'alice', status: 'online', avatarColor: '#C084FC' }) },
          { id: 'u2', data: () => ({ name: 'bob', status: 'active 2h ago', avatarColor: '#9333EA' }) },
        ],
      });
      return () => {
        // unsubscribe
      };
    }),
  } as any;
});

jest.mock('@/lib/firebase/db', () => ({ db: {} }));

describe('useUsers', () => {
  it('maps firestore snapshot docs to ContactUser[]', () => {
    const { result } = renderHook(() => useUsers());
    expect(result.current).toEqual([
      { id: 'u1', name: 'alice', status: 'online', avatarColor: '#C084FC' },
      { id: 'u2', name: 'bob', status: 'active 2h ago', avatarColor: '#9333EA' },
    ]);
  });
});
