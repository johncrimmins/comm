import { initializeAuth, getReactNativePersistence, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { db } from './db';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from './app';
import { createOrFindConversation } from '@/services/chat';

// Initialize Auth with platform-specific persistence
// Use singleton pattern to avoid re-initialization
let authInstance: ReturnType<typeof getAuth> | null = null;

export const auth = (() => {
  if (!authInstance) {
    // Web uses getAuth() which automatically uses localStorage
    if (Platform.OS === 'web') {
      authInstance = getAuth(app);
    } else {
      // React Native (iOS/Android) uses AsyncStorage persistence
      try {
        authInstance = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } catch (error: any) {
        // If already initialized (e.g., hot reload), get existing instance
        if (error.code === 'auth/already-initialized') {
          authInstance = getAuth(app);
        } else {
          throw error;
        }
      }
    }
  }
  return authInstance;
})();

export const onAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred;
};

export const signUp = async (email: string, password: string, displayName?: string, title?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user, displayName, title);
  return cred;
};

export const logOut = () => signOut(auth);

function getDeterministicColorFor(uid: string): string {
  // Always return black for profile avatars
  return '#000000';
}

async function ensureUserProfile(user: User, displayName?: string, title?: string): Promise<void> {
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const name = displayName || (user.email?.split('@')[0] || 'user').toLowerCase();
    const isNewUser = !snap.exists();
    
    if (isNewUser) {
      await setDoc(ref, {
        name,
        avatarColor: getDeterministicColorFor(user.uid),
      }, { merge: true });
      
      // Create AI conversation for new users with title
      await createOrFindConversation([user.uid, 'ai-assistant'], title);
    } else {
      // Merge to avoid overwriting any existing fields
      await setDoc(ref, {
        name,
      }, { merge: true });
    }
  } catch (e) {
    // Silent failure for MVP; no UI surfacing
  }
}

