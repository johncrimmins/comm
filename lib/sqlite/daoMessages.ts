import { exec, initDatabase, nowMs, generateId } from './connection';
import type { SqlMessage, MessageStatus } from './models';

export async function insertMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<SqlMessage> {
  await initDatabase();
  const id = generateId('m');
  const createdAt = nowMs();
  await exec(
    `INSERT INTO messages (id, conversationId, senderId, text, createdAt, serverCreatedAt, status)
     VALUES (?, ?, ?, ?, ?, NULL, NULL)`,
    [id, conversationId, senderId, text, createdAt]
  );
  await exec(`UPDATE conversations SET updatedAt = ? WHERE id = ?`, [createdAt, conversationId]);
  return { id, conversationId, senderId, text, createdAt, serverCreatedAt: null, status: null };
}

export async function listMessagesByConversation(conversationId: string): Promise<SqlMessage[]> {
  await initDatabase();
  const res = await exec(
    `SELECT id, conversationId, senderId, text, createdAt, serverCreatedAt, status FROM messages WHERE conversationId = ? ORDER BY createdAt ASC`,
    [conversationId]
  );
  const rows = Array.from({ length: res.rows.length }, (_, i) => res.rows.item(i));
  return rows.map((r: any) => ({
    id: r.id as string,
    conversationId: r.conversationId as string,
    senderId: r.senderId as string,
    text: r.text as string,
    createdAt: Number(r.createdAt),
    serverCreatedAt: r.serverCreatedAt == null ? null : Number(r.serverCreatedAt),
    status: r.status as MessageStatus | null,
  }));
}

export async function upsertMessageFromRemote(
  remoteMsgId: string,
  localConversationId: string,
  senderId: string,
  text: string,
  serverCreatedAtMs: number
): Promise<void> {
  await initDatabase();
  await exec(
    `INSERT OR IGNORE INTO messages (id, conversationId, senderId, text, createdAt, serverCreatedAt, status)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [remoteMsgId, localConversationId, senderId, text, serverCreatedAtMs, serverCreatedAtMs]
  );
  await exec(
    `UPDATE messages SET serverCreatedAt = COALESCE(serverCreatedAt, ?)
     WHERE id = ?`,
    [serverCreatedAtMs, remoteMsgId]
  );
  await exec(`UPDATE conversations SET updatedAt = ? WHERE id = ?`, [serverCreatedAtMs, localConversationId]);
}

export async function markMessageSent(messageId: string): Promise<void> {
  await initDatabase();
  await exec(
    `UPDATE messages SET status = 'sent' WHERE id = ? AND (status IS NULL OR status != 'read')`,
    [messageId]
  );
}


export async function markLocalAsSentByMatch(
  conversationId: string,
  senderId: string,
  text: string,
  serverCreatedAtMs: number
): Promise<void> {
  await initDatabase();
  // Update the most recent local message without a serverCreatedAt that matches by text and sender
  await exec(
    `UPDATE messages
     SET status = 'sent', serverCreatedAt = COALESCE(serverCreatedAt, ?)
     WHERE id = (
       SELECT id FROM messages
       WHERE conversationId = ? AND senderId = ? AND text = ? AND serverCreatedAt IS NULL
       ORDER BY createdAt DESC
       LIMIT 1
     )`,
    [serverCreatedAtMs, conversationId, senderId, text]
  );
}


