export type MessageStatus = 'sent' | 'delivered' | 'read';

export type SqlUser = {
  id: string;
  remoteId?: string | null;
  displayName: string;
  lastActiveAt?: number | null;
  isOnline?: number | null;
};

export type SqlConversation = {
  id: string;
  remoteId?: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SqlMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
  serverCreatedAt?: number | null;
  status?: MessageStatus | null;
};

export type SqlReceipt = {
  conversationId: string;
  userId: string;
  lastReadAt: number;
};

export type SqlTyping = {
  conversationId: string;
  userId: string;
  isTyping: number;
  updatedAt: number;
};

export type SqlSyncOp = {
  id: string;
  type: string;
  payload: string;
  createdAt: number;
  attemptCount: number;
  error?: string | null;
};

export type ConversationPreview = {
  id: string;
  lastMessageText?: string | null;
  lastMessageAt?: number | null;
  unreadCount?: number;
};


