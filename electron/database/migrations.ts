import { getDatabase } from './db';

export function initDatabase(): void {
  const db = getDatabase();

  // ============================================
  // AUTH TABLES
  // ============================================

  // User table (single user enforced via CHECK constraint)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_user (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    );
  `);

  // Sessions table (for "remember me" functionality)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
    );
  `);

  // ============================================
  // EXAMPLE DATA TABLES
  // ============================================

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Items table (example CRUD model)
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // ============================================
  // INDEXES
  // ============================================

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
  `);

  // ============================================
  // TRIGGERS
  // ============================================

  // Update timestamp trigger for items
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_items_timestamp
    AFTER UPDATE ON items
    BEGIN
      UPDATE items SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  // Insert default categories if table is empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
    insertCategory.run('cat-1', 'General');
    insertCategory.run('cat-2', 'Electronics');
    insertCategory.run('cat-3', 'Office Supplies');
    console.log('Default categories created');
  }

  console.log('Database initialized successfully');
}
