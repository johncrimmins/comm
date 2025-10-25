import { exec, initDatabase, nowMs, generateId } from './connection';
import type { SqlConversation, ConversationPreview } from './models';

export async function insertConversation(participantIds: string[]): Promise<SqlConversation> {
  await initDatabase();
  const id = generateId('c');
  const ts = nowMs();
  await exec(
    `INSERT INTO conversations (id, remoteId, createdAt, updatedAt) VALUES (?, NULL, ?, ?)`,
    [id, ts, ts]
  );
  if (participantIds.length > 0) {
    await Promise.all(
      participantIds.map((userId) =>
        exec(`INSERT OR IGNORE INTO participants (conversationId, userId, role) VALUES (?, ?, NULL)`, [id, userId])
      )
    );
  }
  return { id, remoteId: null, createdAt: ts, updatedAt: ts };
}

export async function listConversationsWithPreview(currentUserId: string): Promise<ConversationPreview[]> {
  await initDatabase();
  const res = await exec(
    `SELECT c.id,
            (SELECT text FROM messages m WHERE m.conversationId = c.id ORDER BY m.createdAt DESC LIMIT 1) AS lastMessageText,
            (SELECT createdAt FROM messages m2 WHERE m2.conversationId = c.id ORDER BY m2.createdAt DESC LIMIT 1) AS lastMessageAt,
            COALESCE((
              SELECT COUNT(1) FROM messages mx
              LEFT JOIN receipts r ON r.conversationId = mx.conversationId AND r.userId = ?
              WHERE mx.conversationId = c.id
                AND mx.senderId != ?
                AND (r.lastReadAt IS NULL OR mx.createdAt > r.lastReadAt)
            ), 0) AS unreadCount
     FROM conversations c
     INNER JOIN participants p ON p.conversationId = c.id AND p.userId = ?
     ORDER BY c.updatedAt DESC`,
    [currentUserId, currentUserId, currentUserId]
  );
  const rows = Array.from({ length: res.rows.length }, (_, i) => res.rows.item(i));
  return rows.map((r: any) => ({
    id: r.id as string,
    lastMessageText: (r.lastMessageText as string) ?? null,
    lastMessageAt: (r.lastMessageAt as number) ?? null,
    unreadCount: Number(r.unreadCount ?? 0),
  }));
}

export async function linkRemoteConversationId(localId: string, remoteId: string): Promise<void> {
  await initDatabase();
  await exec(`UPDATE conversations SET remoteId = ?, updatedAt = ? WHERE id = ?`, [remoteId, nowMs(), localId]);
}

export async function getRemoteIdForLocalConversation(localId: string): Promise<string | null> {
  await initDatabase();
  const res = await exec(`SELECT remoteId FROM conversations WHERE id = ? LIMIT 1`, [localId]);
  if (res.rows.length === 0) return null;
  const v = (res.rows.item(0) as any).remoteId as string | null;
  return v ?? null;
}

export async function findLocalConversationIdByRemote(remoteId: string): Promise<string | null> {
  await initDatabase();
  const res = await exec(`SELECT id FROM conversations WHERE remoteId = ? LIMIT 1`, [remoteId]);
  if (res.rows.length === 0) return null;
  return (res.rows.item(0) as any).id as string;
}

export async function ensureConversationForRemote(
  remoteId: string,
  participantIds: string[],
  createdAtMs: number,
  updatedAtMs: number
): Promise<string> {
  await initDatabase();
  let localId = await findLocalConversationIdByRemote(remoteId);
  if (!localId) {
    localId = generateId('c');
    await exec(
      `INSERT INTO conversations (id, remoteId, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      [localId, remoteId, createdAtMs, updatedAtMs]
    );
    if (participantIds.length > 0) {
      await Promise.all(
        participantIds.map((uid) =>
          exec(
            `INSERT OR IGNORE INTO participants (conversationId, userId, role) VALUES (?, ?, NULL)`,
            [localId!, uid]
          )
        )
      );
    }
  } else {
    await exec(`UPDATE conversations SET updatedAt = ? WHERE id = ?`, [updatedAtMs, localId]);
  }
  return localId;
}


