/**
 * Central Configuration File
 *
 * Customize this file to configure your application.
 * These settings are used throughout the app.
 */

export const AppConfig = {
  // ============================================
  // APP IDENTITY
  // ============================================
  name: 'My Business App',
  shortName: 'MyApp',
  description: 'Offline desktop application for business management',
  version: '1.0.0',

  // ============================================
  // DATABASE SETTINGS
  // ============================================
  database: {
    // Name of the SQLite database file (stored in app data folder)
    name: 'app-data.db',
    // Prefix for backup files
    backupPrefix: 'app-backup',
  },

  // ============================================
  // BACKUP SETTINGS
  // ============================================
  backup: {
    // Maximum number of backup files to keep
    maxBackups: 7,
    // Hours between periodic automatic backups
    periodicIntervalHours: 6,
    // Hours threshold - if last backup is older, create new one on startup
    startupThresholdHours: 24,
  },

  // ============================================
  // AUTHENTICATION SETTINGS
  // ============================================
  auth: {
    // Days before "remember me" session expires
    sessionExpiryDays: 30,
    // Enable/disable "remember me" checkbox
    rememberMeEnabled: true,
  },

  // ============================================
  // NAVIGATION
  // ============================================
  // Define your app's navigation menu
  // Available icons: https://lucide.dev/icons
  navigation: [
    { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/items', label: 'Items', icon: 'Package' },
    { href: '/settings', label: 'Settings', icon: 'Settings' },
  ],

  // ============================================
  // WINDOW SETTINGS
  // ============================================
  window: {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
  },
};

export type AppConfigType = typeof AppConfig;
