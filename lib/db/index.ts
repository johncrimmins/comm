/**
 * SQLite Database Connection
 * Lightweight implementation for offline caching
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    console.log('💾 [DB] Opening database connection');
    db = await SQLite.openDatabaseAsync('comm.db');
    await initializeSchema();
    console.log('✅ [DB] Database connection established');
  }
  return db;
}

/**
 * Initialize database schema
 */
async function initializeSchema() {
  if (!db) {
    console.error('❌ [DB] Cannot initialize schema - database not opened');
    return;
  }
  
  try {
    // Check current version
    const versionResult = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    const currentVersion = versionResult?.user_version || 0;
    
    console.log(`📊 [DB] Current schema version: ${currentVersion}, target: ${SCHEMA_VERSION}`);
    
    if (currentVersion < SCHEMA_VERSION) {
      console.log(`📊 [DB] Initializing schema version ${SCHEMA_VERSION}`);
      
      // Enable foreign keys
      await db.execAsync('PRAGMA foreign_keys = ON');
      
      // Execute schema
      const statements = SCHEMA.split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      console.log(`📊 [DB] Executing ${statements.length} schema statements`);
      
      for (const statement of statements) {
        await db.execAsync(statement);
      }
      
      // Update version
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      
      console.log('✅ [DB] Schema initialized successfully');
    } else {
      console.log('✅ [DB] Schema already up to date');
    }
  } catch (error) {
    console.error('❌ [DB] Error initializing schema:', error);
    throw error;
  }
}

/**
 * Execute a query and return results
 */
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const database = await getDatabase();
  try {
    const result = await database.getAllAsync(sql, params);
    return result;
  } catch (error) {
    console.error(`❌ [DB] Query failed: ${sql.substring(0, 50)}...`, error);
    throw error;
  }
}

/**
 * Execute a mutation (INSERT, UPDATE, DELETE)
 */
export async function execute(sql: string, params: any[] = []): Promise<void> {
  const database = await getDatabase();
  try {
    await database.runAsync(sql, params);
  } catch (error) {
    console.error(`❌ [DB] Execute failed: ${sql.substring(0, 50)}...`, error);
    throw error;
  }
}

/**
 * Execute multiple statements in a transaction
 */
export async function executeTransaction(statements: Array<{ sql: string; params: any[] }>): Promise<void> {
  const database = await getDatabase();
  
  try {
    await database.withTransactionAsync(async () => {
      for (const { sql, params } of statements) {
        await database.runAsync(sql, params);
      }
    });
  } catch (error) {
    console.error(`❌ [DB] Transaction failed:`, error);
    throw error;
  }
}

/**
 * Close database connection (for testing)
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

