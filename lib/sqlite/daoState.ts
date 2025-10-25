import { exec, initDatabase } from './connection';

export async function upsertReceipt(conversationId: string, userId: string, lastReadAt: number): Promise<void> {
  await initDatabase();
  await exec(
    `INSERT INTO receipts (conversationId, userId, lastReadAt)
     VALUES (?, ?, ?)
     ON CONFLICT(conversationId, userId) DO UPDATE SET lastReadAt = excluded.lastReadAt`,
    [conversationId, userId, lastReadAt]
  );
}

export async function setTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean,
  updatedAt: number
): Promise<void> {
  await initDatabase();
  await exec(
    `INSERT INTO typing (conversationId, userId, isTyping, updatedAt)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(conversationId, userId) DO UPDATE SET isTyping = excluded.isTyping, updatedAt = excluded.updatedAt`,
    [conversationId, userId, isTyping ? 1 : 0, updatedAt]
  );
}

export async function upsertUserPresence(userId: string, isOnline: boolean, lastActiveAtMs: number): Promise<void> {
  await initDatabase();
  await exec(
    `INSERT INTO users (id, remoteId, displayName, lastActiveAt, isOnline)
     VALUES (?, NULL, COALESCE((SELECT displayName FROM users WHERE id = ?), ''), ?, ?)
     ON CONFLICT(id) DO UPDATE SET lastActiveAt = excluded.lastActiveAt, isOnline = excluded.isOnline`,
    [userId, userId, lastActiveAtMs, isOnline ? 1 : 0]
  );
}

export async function isSomeoneTyping(conversationId: string): Promise<boolean> {
  await initDatabase();
  const res = await exec(
    `SELECT COUNT(1) as c FROM typing WHERE conversationId = ? AND isTyping = 1`,
    [conversationId]
  );
  const c = Number((res.rows.item(0) as any).c ?? 0);
  return c > 0;
}

export async function applyOutgoingStatusMarkers(
  localConversationId: string,
  senderId: string,
  minDeliveredAtMs: number | null,
  minReadAtMs: number | null
): Promise<void> {
  await initDatabase();
  if (minDeliveredAtMs != null) {
    await exec(
      `UPDATE messages
       SET status = 'delivered'
       WHERE conversationId = ? AND senderId = ?
         AND serverCreatedAt IS NOT NULL
         AND serverCreatedAt <= ?
         AND (status IS NULL OR status = 'sent')`,
      [localConversationId, senderId, minDeliveredAtMs]
    );
  }
  if (minReadAtMs != null) {
    await exec(
      `UPDATE messages
       SET status = 'read'
       WHERE conversationId = ? AND senderId = ?
         AND serverCreatedAt IS NOT NULL
         AND serverCreatedAt <= ?`,
      [localConversationId, senderId, minReadAtMs]
    );
  }
}

export async function isAnyParticipantOnline(
  conversationId: string,
  exceptUserId?: string
): Promise<boolean> {
  await initDatabase();
  const res = await exec(
    `SELECT COUNT(1) as c
     FROM participants p
     JOIN users u ON u.id = p.userId
     WHERE p.conversationId = ?
       AND (? IS NULL OR p.userId != ?)
       AND u.isOnline = 1
       AND (u.lastActiveAt IS NULL OR (strftime('%s','now') * 1000 - u.lastActiveAt) <= 60000)`,
    [conversationId, exceptUserId ?? null, exceptUserId ?? null]
  );
  const c = Number((res.rows.item(0) as any).c ?? 0);
  return c > 0;
}


