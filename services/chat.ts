import { db } from '@/lib/firebase/db';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

export type ServiceMessage = {
  id?: string;
  text: string;
  senderId: string;
  createdAt: unknown; // Firestore Timestamp | null
};

export const onMessages = (
  conversationId: string,
  cb: (messages: ServiceMessage[]) => void
) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const data: ServiceMessage[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceMessage, 'id'>) }));
    cb(data);
  });
};

export const sendMessage = (
  conversationId: string,
  text: string,
  senderId: string
) => {
  return addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    text,
    senderId,
    createdAt: serverTimestamp(),
  });
};


