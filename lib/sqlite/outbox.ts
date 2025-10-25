import { exec, initDatabase, nowMs, generateId } from './connection';
import type { SqlSyncOp } from './models';

export async function enqueueSyncOp(type: string, payload: unknown): Promise<SqlSyncOp> {
  await initDatabase();
  const id = generateId('op');
  const createdAt = nowMs();
  const payloadStr = JSON.stringify(payload ?? {});
  await exec(
    `INSERT INTO sync_ops (id, type, payload, createdAt, attemptCount, error) VALUES (?, ?, ?, ?, 0, NULL)`,
    [id, type, payloadStr, createdAt]
  );
  return { id, type, payload: payloadStr, createdAt, attemptCount: 0, error: null };
}

export async function nextSyncOp(): Promise<SqlSyncOp | null> {
  await initDatabase();
  const res = await exec(
    `SELECT id, type, payload, createdAt, attemptCount, error
     FROM sync_ops
     ORDER BY createdAt ASC
     LIMIT 1`
  );
  if (res.rows.length === 0) return null;
  const r = res.rows.item(0) as any;
  return {
    id: r.id as string,
    type: r.type as string,
    payload: r.payload as string,
    createdAt: Number(r.createdAt),
    attemptCount: Number(r.attemptCount),
    error: r.error as string | null,
  };
}

export async function incrementSyncOpAttempt(opId: string, error?: string): Promise<void> {
  await initDatabase();
  await exec(
    `UPDATE sync_ops SET attemptCount = attemptCount + 1, error = ? WHERE id = ?`,
    [error ?? null, opId]
  );
}

export async function markOpDone(opId: string): Promise<void> {
  await initDatabase();
  await exec(`DELETE FROM sync_ops WHERE id = ?`, [opId]);
}


