import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

export type ContactUser = {
  id: string;
  name: string;
  avatarColor: string;
};

export function useUsers(): ContactUser[] {
  const [users, setUsers] = useState<ContactUser[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const list: ContactUser[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name ?? 'user',
          avatarColor: data.avatarColor ?? '#000000',
        };
      });
      setUsers(list);
    });
    return () => unsub();
  }, []);

  return users;
}
