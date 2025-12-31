const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor(dbPath = './data/database.db') {
    this.dbPath = dbPath;
    this.ensureDataDirectory();
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // Better performance
    this.initializeTables();
    console.log('[DATABASE] SQLite database initialized');
  }

  /**
   * Ensure the data directory exists
   */
  ensureDataDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[DATABASE] Created data directory: ${dir}`);
    }
  }

  /**
   * Initialize default tables
   */
  initializeTables() {
    // Key-value store table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        collection TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (collection, key)
      )
    `);

    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        data TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Guilds table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        guild_id TEXT PRIMARY KEY,
        guild_name TEXT,
        data TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    console.log('[DATABASE] Tables initialized');
  }

  /**
   * Set a value in the key-value store
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @param {*} value - The value (will be JSON stringified)
   * @returns {boolean} Success status
   */
  set(collection, key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO kv_store (collection, key, value, updated_at)
        VALUES (?, ?, ?, strftime('%s', 'now'))
        ON CONFLICT(collection, key) DO UPDATE SET
          value = excluded.value,
          updated_at = strftime('%s', 'now')
      `);

      stmt.run(collection, key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[DATABASE] Error setting value:', error);
      return false;
    }
  }

  /**
   * Get a value from the key-value store
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @returns {*} The value or null if not found
   */
  get(collection, key) {
    try {
      const stmt = this.db.prepare(
        'SELECT value FROM kv_store WHERE collection = ? AND key = ?'
      );
      const row = stmt.get(collection, key);
      return row ? JSON.parse(row.value) : null;
    } catch (error) {
      console.error('[DATABASE] Error getting value:', error);
      return null;
    }
  }

  /**
   * Check if a key exists
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @returns {boolean} Whether the key exists
   */
  has(collection, key) {
    try {
      const stmt = this.db.prepare(
        'SELECT 1 FROM kv_store WHERE collection = ? AND key = ? LIMIT 1'
      );
      return stmt.get(collection, key) !== undefined;
    } catch (error) {
      console.error('[DATABASE] Error checking key:', error);
      return false;
    }
  }

  /**
   * Delete a key from the key-value store
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @returns {boolean} Success status
   */
  delete(collection, key) {
    try {
      const stmt = this.db.prepare(
        'DELETE FROM kv_store WHERE collection = ? AND key = ?'
      );
      const result = stmt.run(collection, key);
      return result.changes > 0;
    } catch (error) {
      console.error('[DATABASE] Error deleting key:', error);
      return false;
    }
  }

  /**
   * Get all values from a collection
   * @param {string} collection - The collection name
   * @returns {Array} Array of parsed values with their keys
   */
  getAll(collection) {
    try {
      const stmt = this.db.prepare(
        'SELECT key, value FROM kv_store WHERE collection = ?'
      );
      const rows = stmt.all(collection);
      return rows.map(row => ({
        key: row.key,
        ...JSON.parse(row.value),
      }));
    } catch (error) {
      console.error('[DATABASE] Error getting all values:', error);
      return [];
    }
  }

  /**
   * Get all entries from a collection
   * @param {string} collection - The collection name
   * @returns {Object} All entries as key-value pairs
   */
  all(collection) {
    try {
      const stmt = this.db.prepare(
        'SELECT key, value FROM kv_store WHERE collection = ?'
      );
      const rows = stmt.all(collection);
      const result = {};
      for (const row of rows) {
        result[row.key] = JSON.parse(row.value);
      }
      return result;
    } catch (error) {
      console.error('[DATABASE] Error getting all entries:', error);
      return {};
    }
  }

  /**
   * Clear all entries from a collection
   * @param {string} collection - The collection name
   * @returns {boolean} Success status
   */
  clear(collection) {
    try {
      const stmt = this.db.prepare('DELETE FROM kv_store WHERE collection = ?');
      stmt.run(collection);
      return true;
    } catch (error) {
      console.error('[DATABASE] Error clearing collection:', error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @param {number} amount - The amount to increment by (default: 1)
   * @returns {number} The new value
   */
  increment(collection, key, amount = 1) {
    try {
      const current = this.get(collection, key) || 0;
      const newValue = current + amount;
      this.set(collection, key, newValue);
      return newValue;
    } catch (error) {
      console.error('[DATABASE] Error incrementing value:', error);
      return 0;
    }
  }

  /**
   * Decrement a numeric value
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @param {number} amount - The amount to decrement by (default: 1)
   * @returns {number} The new value
   */
  decrement(collection, key, amount = 1) {
    return this.increment(collection, key, -amount);
  }

  /**
   * Push a value to an array
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @param {*} value - The value to push
   * @returns {boolean} Success status
   */
  push(collection, key, value) {
    try {
      const current = this.get(collection, key);
      const array = Array.isArray(current) ? current : [];
      array.push(value);
      return this.set(collection, key, array);
    } catch (error) {
      console.error('[DATABASE] Error pushing value:', error);
      return false;
    }
  }

  /**
   * Remove a value from an array
   * @param {string} collection - The collection name
   * @param {string} key - The key
   * @param {*} value - The value to remove
   * @returns {boolean} Success status
   */
  pull(collection, key, value) {
    try {
      const current = this.get(collection, key);
      if (!Array.isArray(current)) return false;
      const filtered = current.filter(item => item !== value);
      return this.set(collection, key, filtered);
    } catch (error) {
      console.error('[DATABASE] Error pulling value:', error);
      return false;
    }
  }

  /**
   * Get all collection names
   * @returns {Array<string>} Array of collection names
   */
  getCollections() {
    try {
      const stmt = this.db.prepare('SELECT DISTINCT collection FROM kv_store');
      const rows = stmt.all();
      return rows.map(row => row.collection);
    } catch (error) {
      console.error('[DATABASE] Error getting collections:', error);
      return [];
    }
  }

  /**
   * Execute a raw SQL query (for advanced usage)
   * @param {string} sql - The SQL query
   * @param {Array} params - Query parameters
   * @returns {*} Query result
   */
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      console.error('[DATABASE] Error executing query:', error);
      return [];
    }
  }

  /**
   * Execute a raw SQL statement (for advanced usage)
   * @param {string} sql - The SQL statement
   * @param {Array} params - Statement parameters
   * @returns {*} Statement result
   */
  exec(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(...params);
    } catch (error) {
      console.error('[DATABASE] Error executing statement:', error);
      return null;
    }
  }

  /**
   * Create a custom table
   * @param {string} tableName - The table name
   * @param {string} schema - The table schema (SQL)
   * @returns {boolean} Success status
   */
  createTable(tableName, schema) {
    try {
      this.db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`);
      console.log(`[DATABASE] Table '${tableName}' created`);
      return true;
    } catch (error) {
      console.error(`[DATABASE] Error creating table '${tableName}':`, error);
      return false;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    this.db.close();
    console.log('[DATABASE] Database connection closed');
  }

  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  getStats() {
    try {
      const collections = this.getCollections();
      const stats = {
        collections: collections.length,
        collectionNames: collections,
        totalEntries: 0,
      };

      for (const collection of collections) {
        const stmt = this.db.prepare(
          'SELECT COUNT(*) as count FROM kv_store WHERE collection = ?'
        );
        const result = stmt.get(collection);
        stats.totalEntries += result.count;
        stats[collection] = result.count;
      }

      return stats;
    } catch (error) {
      console.error('[DATABASE] Error getting stats:', error);
      return {};
    }
  }

  /**
   * Backup the database
   * @param {string} backupPath - Path for the backup file
   * @returns {boolean} Success status
   */
  backup(backupPath) {
    try {
      // Ensure the directory exists
      const dir = path.dirname(backupPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Force a checkpoint to ensure all data is written
      this.db.pragma('wal_checkpoint(TRUNCATE)');

      // Copy the database file
      fs.copyFileSync(this.dbPath, backupPath);

      // Also copy WAL and SHM files if they exist
      const walPath = this.dbPath + '-wal';
      const shmPath = this.dbPath + '-shm';

      if (fs.existsSync(walPath)) {
        fs.copyFileSync(walPath, backupPath + '-wal');
      }
      if (fs.existsSync(shmPath)) {
        fs.copyFileSync(shmPath, backupPath + '-shm');
      }

      console.log(`[DATABASE] Backup created at ${backupPath}`);
      return true;
    } catch (error) {
      console.error('[DATABASE] Error creating backup:', error);
      return false;
    }
  }
}

// Export a singleton instance
module.exports = new DatabaseManager();
