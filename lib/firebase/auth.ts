import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { app } from './app';

export const auth = getAuth(app);

export const onAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);


