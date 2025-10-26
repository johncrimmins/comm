/**
 * SQLite Schema for offline caching
 * This is a write-through cache of Firestore data
 */

export const SCHEMA_VERSION = 1;

export const SCHEMA = `
  -- Conversations cache
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    participantIds TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  -- Messages cache
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    status TEXT
  );

  -- Pending messages (for offline sends)
  CREATE TABLE IF NOT EXISTS pending_messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    retryCount INTEGER DEFAULT 0
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversationId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updatedAt DESC);
  CREATE INDEX IF NOT EXISTS idx_pending_messages ON pending_messages(createdAt);
`;

