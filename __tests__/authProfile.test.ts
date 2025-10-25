import { signUp, signIn } from '@/lib/firebase/auth';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(async (_auth, email: string) => ({ user: { uid: 'uid123', email } })),
  createUserWithEmailAndPassword: jest.fn(async (_auth, email: string) => ({ user: { uid: 'uid456', email } })),
  signOut: jest.fn(),
}));

const setDocMock = jest.fn();
const getDocMock = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db, _col, _id) => ({})),
  getDoc: jest.fn((...args: any[]) => getDocMock(...args)),
  setDoc: jest.fn((...args: any[]) => setDocMock(...args)),
}));

jest.mock('@/lib/firebase/db', () => ({ db: {} }));

describe('auth profile creation', () => {
  beforeEach(() => {
    setDocMock.mockReset();
    getDocMock.mockReset();
  });

  it('creates user profile on signUp when missing', async () => {
    getDocMock.mockResolvedValueOnce({ exists: () => false });
    await signUp('alice@example.com', 'pw');
    expect(setDocMock).toHaveBeenCalled();
  });

  it('merges user profile on signIn when exists', async () => {
    getDocMock.mockResolvedValueOnce({ exists: () => true });
    await signIn('bob@example.com', 'pw');
    expect(setDocMock).toHaveBeenCalled();
  });
});
