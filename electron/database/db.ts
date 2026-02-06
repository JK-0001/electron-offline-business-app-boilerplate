import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { AppConfig } from '../../app.config';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, AppConfig.database.name);

    console.log('Database path:', dbPath);

    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
  }

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDatabasePath(): string {
  return path.join(app.getPath('userData'), AppConfig.database.name);
}
