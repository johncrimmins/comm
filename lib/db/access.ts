/**
 * Database Access Layer
 * Simple read/write functions for SQLite cache
 */

import { query, execute, executeTransaction } from './index';

export interface Conversation {
  id: string;
  participantIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
  status?: 'sent' | 'delivered' | 'read' | null;
}

export interface PendingMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
  retryCount: number;
}

// ============================================================================
// Conversations
// ============================================================================

export async function saveConversation(conversation: Conversation): Promise<void> {
  await execute(
    'INSERT OR REPLACE INTO conversations (id, participantIds, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    [conversation.id, JSON.stringify(conversation.participantIds), conversation.createdAt, conversation.updatedAt]
  );
}

export async function getConversations(): Promise<Conversation[]> {
  const rows = await query('SELECT * FROM conversations ORDER BY updatedAt DESC');
  return rows.map(row => ({
    ...row,
    participantIds: JSON.parse(row.participantIds),
  }));
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const rows = await query('SELECT * FROM conversations WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    ...row,
    participantIds: JSON.parse(row.participantIds),
  };
}

// ============================================================================
// Messages
// ============================================================================

export async function saveMessage(message: Message): Promise<void> {
  await execute(
    'INSERT OR REPLACE INTO messages (id, conversationId, senderId, text, createdAt, status) VALUES (?, ?, ?, ?, ?, ?)',
    [message.id, message.conversationId, message.senderId, message.text, message.createdAt, message.status || null]
  );
}

export async function saveMessages(messages: Message[]): Promise<void> {
  if (messages.length === 0) return;
  
  const statements = messages.map(msg => ({
    sql: 'INSERT OR REPLACE INTO messages (id, conversationId, senderId, text, createdAt, status) VALUES (?, ?, ?, ?, ?, ?)',
    params: [msg.id, msg.conversationId, msg.senderId, msg.text, msg.createdAt, msg.status || null],
  }));
  
  await executeTransaction(statements);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const rows = await query(
    'SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC',
    [conversationId]
  );
  return rows;
}

export async function getMessagesCount(conversationId: string): Promise<number> {
  const rows = await query(
    'SELECT COUNT(*) as count FROM messages WHERE conversationId = ?',
    [conversationId]
  );
  return rows[0]?.count || 0;
}

// ============================================================================
// Pending Messages (for offline sends)
// ============================================================================

export async function savePendingMessage(message: Omit<PendingMessage, 'retryCount'>): Promise<void> {
  await execute(
    'INSERT INTO pending_messages (id, conversationId, senderId, text, createdAt, retryCount) VALUES (?, ?, ?, ?, ?, 0)',
    [message.id, message.conversationId, message.senderId, message.text, message.createdAt]
  );
}

export async function getPendingMessages(): Promise<PendingMessage[]> {
  return await query('SELECT * FROM pending_messages ORDER BY createdAt ASC');
}

export async function deletePendingMessage(id: string): Promise<void> {
  await execute('DELETE FROM pending_messages WHERE id = ?', [id]);
}

export async function incrementPendingRetry(id: string): Promise<void> {
  await execute('UPDATE pending_messages SET retryCount = retryCount + 1 WHERE id = ?', [id]);
}

// ============================================================================
// Cache Management
// ============================================================================

export async function clearConversations(): Promise<void> {
  await execute('DELETE FROM conversations');
}

export async function clearMessages(conversationId?: string): Promise<void> {
  if (conversationId) {
    await execute('DELETE FROM messages WHERE conversationId = ?', [conversationId]);
  } else {
    await execute('DELETE FROM messages');
  }
}

export async function clearPendingMessages(): Promise<void> {
  await execute('DELETE FROM pending_messages');
}

