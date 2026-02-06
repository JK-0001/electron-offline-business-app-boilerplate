import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { AppConfig } from '../app.config';

// Database imports
import { initDatabase } from './database/migrations';
import { closeDatabase } from './database/db';

// Handler imports
import * as authHandlers from './database/auth';
import * as itemHandlers from './database/items';
import {
  createBackup,
  createManualBackup,
  checkAndCreateBackupOnStartup,
  startPeriodicBackup,
  stopPeriodicBackup,
  createBackupOnClose,
  getBackupInfo,
} from './database/backup';

// Types
import type {
  SetupData,
  LoginData,
  ChangePasswordData,
  ItemFilters,
  CreateItemData,
  UpdateItemData,
} from './types';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;

// Vite dev server URL
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    width: AppConfig.window.width,
    height: AppConfig.window.height,
    minWidth: AppConfig.window.minWidth,
    minHeight: AppConfig.window.minHeight,
    icon: path.join(__dirname, '../build-resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: AppConfig.name,
  });

  // Hide menu bar
  win.setMenuBarVisibility(false);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools in development
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }

  // Handle window close
  win.on('close', () => {
    createBackupOnClose();
  });
}

// ============================================
// IPC HANDLERS - AUTH
// ============================================

ipcMain.handle('auth:checkSetup', () => {
  return authHandlers.isSetupComplete();
});

ipcMain.handle('auth:setup', async (_, data: SetupData) => {
  return authHandlers.createUser(data);
});

ipcMain.handle('auth:login', async (_, data: LoginData) => {
  return authHandlers.login(data);
});

ipcMain.handle('auth:logout', (_, sessionToken?: string) => {
  return authHandlers.logout(sessionToken);
});

ipcMain.handle('auth:validateSession', (_, sessionToken: string) => {
  return authHandlers.validateSession(sessionToken);
});

ipcMain.handle('auth:changePassword', async (_, data: ChangePasswordData) => {
  return authHandlers.changePassword(data);
});

// ============================================
// IPC HANDLERS - ITEMS
// ============================================

ipcMain.handle('items:getAll', (_, filters?: ItemFilters) => {
  return itemHandlers.getAllItems(filters);
});

ipcMain.handle('items:getById', (_, id: string) => {
  return itemHandlers.getItemById(id);
});

ipcMain.handle('items:create', (_, data: CreateItemData) => {
  return itemHandlers.createItem(data);
});

ipcMain.handle('items:update', (_, data: UpdateItemData) => {
  return itemHandlers.updateItem(data);
});

ipcMain.handle('items:delete', (_, id: string) => {
  return itemHandlers.deleteItem(id);
});

// ============================================
// IPC HANDLERS - CATEGORIES
// ============================================

ipcMain.handle('categories:getAll', () => {
  return itemHandlers.getAllCategories();
});

ipcMain.handle('categories:create', (_, name: string) => {
  return itemHandlers.createCategory(name);
});

ipcMain.handle('categories:delete', (_, id: string) => {
  return itemHandlers.deleteCategory(id);
});

// ============================================
// IPC HANDLERS - DASHBOARD
// ============================================

ipcMain.handle('dashboard:getStats', () => {
  return itemHandlers.getDashboardStats();
});

ipcMain.handle('dashboard:getRecentItems', (_, limit?: number) => {
  return itemHandlers.getRecentItems(limit);
});

// ============================================
// IPC HANDLERS - BACKUP
// ============================================

ipcMain.handle('backup:create', () => {
  return createBackup();
});

ipcMain.handle('backup:createManual', async () => {
  return createManualBackup();
});

ipcMain.handle('backup:getInfo', () => {
  return getBackupInfo();
});

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(() => {
  // Initialize database
  initDatabase();

  // Create window
  createWindow();

  // Start backup system
  checkAndCreateBackupOnStartup();
  startPeriodicBackup();

  // Clean up expired sessions periodically (every hour)
  setInterval(() => {
    authHandlers.cleanupExpiredSessions();
  }, 60 * 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopPeriodicBackup();
  closeDatabase();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  createBackupOnClose();
  stopPeriodicBackup();
  closeDatabase();
});
