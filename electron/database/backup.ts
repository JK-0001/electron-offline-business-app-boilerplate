import fs from 'fs';
import path from 'path';
import { app, dialog } from 'electron';
import { AppConfig } from '../../app.config';

const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');
const DB_PATH = path.join(app.getPath('userData'), AppConfig.database.name);
const MAX_BACKUPS = AppConfig.backup.maxBackups;
const BACKUP_PREFIX = AppConfig.database.backupPrefix;
const BACKUP_INTERVAL = AppConfig.backup.periodicIntervalHours * 60 * 60 * 1000;
const BACKUP_THRESHOLD = AppConfig.backup.startupThresholdHours * 60 * 60 * 1000;

let periodicBackupTimer: NodeJS.Timeout | null = null;

// Ensure backup directory exists
export function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Create a backup of the database
export function createBackup(): { success: boolean; message: string; filePath?: string } {
  try {
    ensureBackupDir();

    if (!fs.existsSync(DB_PATH)) {
      return { success: false, message: 'Database file not found' };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
    const backupFileName = `${BACKUP_PREFIX}_${timestamp}_${timeStr}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Copy the database file
    fs.copyFileSync(DB_PATH, backupPath);

    console.log('Backup created:', backupPath);

    // Clean up old backups
    cleanupOldBackups();

    return {
      success: true,
      message: 'Backup created successfully',
      filePath: backupPath,
    };
  } catch (error) {
    console.error('Backup failed:', error);
    return {
      success: false,
      message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Manual backup with user-selected location
export async function createManualBackup(): Promise<{ success: boolean; message: string }> {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { success: false, message: 'Database file not found' };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
    const defaultFileName = `${BACKUP_PREFIX}_${timestamp}_${timeStr}.db`;

    // Show save dialog
    const result = await dialog.showSaveDialog({
      title: 'Save Backup',
      defaultPath: defaultFileName,
      filters: [
        { name: 'Database Files', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Backup cancelled' };
    }

    // Copy the database file to selected location
    fs.copyFileSync(DB_PATH, result.filePath);

    console.log('Manual backup created:', result.filePath);

    return {
      success: true,
      message: `Backup saved to ${result.filePath}`,
    };
  } catch (error) {
    console.error('Manual backup failed:', error);
    return {
      success: false,
      message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Clean up old backups (keep only last MAX_BACKUPS)
function cleanupOldBackups(): void {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith(BACKUP_PREFIX) && file.endsWith('.db'))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first

    // Delete old backups
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      filesToDelete.forEach((file) => {
        fs.unlinkSync(file.path);
        console.log('Deleted old backup:', file.name);
      });
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Get the most recent backup file
function getLastBackupTime(): number | null {
  try {
    ensureBackupDir();
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith(BACKUP_PREFIX) && file.endsWith('.db'))
      .map((file) => ({
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    return files.length > 0 ? files[0].time : null;
  } catch (error) {
    console.error('Error getting last backup time:', error);
    return null;
  }
}

// Check if backup is needed and create one if necessary
export function checkAndCreateBackupOnStartup(): { success: boolean; message: string } {
  const lastBackupTime = getLastBackupTime();

  if (!lastBackupTime) {
    console.log('No previous backups found, creating initial backup...');
    return createBackup();
  }

  const timeSinceLastBackup = Date.now() - lastBackupTime;

  if (timeSinceLastBackup > BACKUP_THRESHOLD) {
    console.log(
      `Last backup was ${Math.floor(timeSinceLastBackup / 1000 / 60 / 60)} hours ago, creating new backup...`
    );
    return createBackup();
  }

  console.log(`Last backup was ${Math.floor(timeSinceLastBackup / 1000 / 60)} minutes ago, skipping startup backup`);
  return { success: true, message: 'Recent backup exists, skipping' };
}

// Start periodic backups
export function startPeriodicBackup(): void {
  // Clear any existing timer
  if (periodicBackupTimer) {
    clearInterval(periodicBackupTimer);
  }

  // Create backup at interval
  periodicBackupTimer = setInterval(() => {
    console.log(`Running periodic backup (${AppConfig.backup.periodicIntervalHours}-hour interval)...`);
    const result = createBackup();
    console.log('Periodic backup result:', result.message);
  }, BACKUP_INTERVAL);

  console.log(`Periodic backup started (every ${AppConfig.backup.periodicIntervalHours} hours)`);
}

// Stop periodic backups
export function stopPeriodicBackup(): void {
  if (periodicBackupTimer) {
    clearInterval(periodicBackupTimer);
    periodicBackupTimer = null;
    console.log('Periodic backup stopped');
  }
}

// Create backup on app close
export function createBackupOnClose(): { success: boolean; message: string } {
  console.log('Creating backup on app close...');
  const result = createBackup();
  console.log('Close backup result:', result.message);
  return result;
}

// Get backup info for display
export function getBackupInfo(): {
  backupDir: string;
  lastBackupTime: number | null;
  backupCount: number;
} {
  ensureBackupDir();

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith(BACKUP_PREFIX) && file.endsWith('.db'));

  return {
    backupDir: BACKUP_DIR,
    lastBackupTime: getLastBackupTime(),
    backupCount: files.length,
  };
}
