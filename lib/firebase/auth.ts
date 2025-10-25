import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { db } from './db';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from './app';

export const auth = getAuth(app);

export const onAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
};

export const signUp = async (email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
};

export const logOut = () => signOut(auth);

function getDeterministicColorFor(uid: string): string {
  const palette = ['#C084FC', '#9333EA', '#A855F7', '#7C3AED'];
  let sum = 0;
  for (let i = 0; i < uid.length; i++) sum = (sum + uid.charCodeAt(i)) % 9973;
  return palette[sum % palette.length];
}

async function ensureUserProfile(user: User): Promise<void> {
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const name = (user.email?.split('@')[0] || 'user').toLowerCase();
    if (!snap.exists()) {
      await setDoc(ref, {
        name,
        status: 'online',
        avatarColor: getDeterministicColorFor(user.uid),
      }, { merge: true });
    } else {
      // Merge to avoid overwriting any existing fields
      await setDoc(ref, {
        name,
        status: 'online',
      }, { merge: true });
    }
  } catch (e) {
    // Silent failure for MVP; no UI surfacing
    // console.debug('ensureUserProfile error', e);
  }
}

