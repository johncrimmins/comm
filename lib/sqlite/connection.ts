import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('comm.db');
  }
  return dbPromise;
}

type ResultRows = { length: number; item: (i: number) => any };
type ExecResult = { rows: ResultRows };

export async function exec(sql: string, params: any[] = []): Promise<ExecResult> {
  const db = await getDb();
  const isSelect = /^\s*(select|pragma)/i.test(sql);
  if (isSelect) {
    const rows = await db.getAllAsync<any>(sql, params as any);
    return {
      rows: {
        length: rows.length,
        item: (i: number) => rows[i],
      },
    };
  }
  await db.runAsync(sql, params as any);
  return { rows: { length: 0, item: () => undefined } };
}

export const SCHEMA_VERSION = 1;

export async function initDatabase(): Promise<void> {
  const versionRes = await exec('PRAGMA user_version');
  const currentVersion = Number((versionRes.rows.item(0) as any)?.user_version ?? 0);

  await exec('PRAGMA foreign_keys = ON');

  if (currentVersion < 1) {
    const sqlScript = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        remoteId TEXT,
        displayName TEXT NOT NULL,
        lastActiveAt INTEGER,
        isOnline INTEGER
      );
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        remoteId TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS participants (
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT,
        PRIMARY KEY (conversationId, userId)
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        text TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        serverCreatedAt INTEGER,
        status TEXT CHECK (status IN ('sent','delivered','read'))
      );
      CREATE TABLE IF NOT EXISTS receipts (
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        lastReadAt INTEGER NOT NULL,
        PRIMARY KEY (conversationId, userId)
      );
      CREATE TABLE IF NOT EXISTS typing (
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        isTyping INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        PRIMARY KEY (conversationId, userId)
      );
      CREATE TABLE IF NOT EXISTS sync_ops (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        attemptCount INTEGER NOT NULL,
        error TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_messages_convo_createdAt ON messages (conversationId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_conversations_updatedAt ON conversations (updatedAt DESC);
      CREATE INDEX IF NOT EXISTS idx_participants_convo_user ON participants (conversationId, userId);
      CREATE INDEX IF NOT EXISTS idx_receipts_convo_user ON receipts (conversationId, userId);
      CREATE INDEX IF NOT EXISTS idx_typing_convo_user ON typing (conversationId, userId);
    `;
    const statements = sqlScript
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await exec(stmt);
    }

    await exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

export function nowMs(): number {
  return Date.now();
}

export function generateId(prefix: string): string {
  return `${prefix}_${nowMs()}_${Math.random().toString(36).slice(2, 8)}`;
}


