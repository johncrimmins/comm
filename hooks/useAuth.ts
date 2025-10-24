import { useEffect, useState } from 'react';
import { onAuth } from '@/lib/firebase/auth';
import type { User } from 'firebase/auth';

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsub = onAuth(setUser);
    return () => unsub();
  }, []);
  return user;
}


