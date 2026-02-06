import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';
import { AppConfig } from '../../app.config';

const SALT_ROUNDS = 12;

export interface AuthUser {
  id: number;
  username: string;
  created_at: string;
  last_login: string | null;
}

export interface SetupData {
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  message: string;
  sessionToken?: string;
  user?: AuthUser;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Check if initial setup is complete (user exists)
export function isSetupComplete(): boolean {
  const db = getDatabase();
  const user = db.prepare('SELECT id FROM auth_user WHERE id = 1').get();
  return !!user;
}

// Create the initial user (first-time setup)
export async function createUser(data: SetupData): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDatabase();

    // Check if user already exists
    if (isSetupComplete()) {
      return { success: false, message: 'User already exists' };
    }

    // Validate input
    if (!data.username || data.username.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters' };
    }

    if (!data.password || data.password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Insert user
    const stmt = db.prepare(`
      INSERT INTO auth_user (id, username, password_hash, created_at)
      VALUES (1, ?, ?, datetime('now'))
    `);

    stmt.run(data.username.toLowerCase().trim(), passwordHash);

    console.log('User created successfully');
    return { success: true, message: 'Account created successfully' };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      message: `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Login user
export async function login(data: LoginData): Promise<LoginResult> {
  try {
    const db = getDatabase();

    // Get user
    const user = db.prepare(`
      SELECT id, username, password_hash, created_at, last_login
      FROM auth_user WHERE id = 1
    `).get() as (AuthUser & { password_hash: string }) | undefined;

    if (!user) {
      return { success: false, message: 'No account exists. Please set up your account first.' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);

    if (!isValidPassword) {
      return { success: false, message: 'Invalid password' };
    }

    // Check username (case-insensitive)
    if (user.username.toLowerCase() !== data.username.toLowerCase().trim()) {
      return { success: false, message: 'Invalid username' };
    }

    // Update last login
    db.prepare('UPDATE auth_user SET last_login = datetime(\'now\') WHERE id = 1').run();

    // Create session if remember me is enabled
    let sessionToken: string | undefined;

    if (data.rememberMe && AppConfig.auth.rememberMeEnabled) {
      sessionToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + AppConfig.auth.sessionExpiryDays);

      // Clean up old sessions first
      db.prepare('DELETE FROM auth_sessions WHERE user_id = 1').run();

      // Create new session
      db.prepare(`
        INSERT INTO auth_sessions (id, user_id, created_at, expires_at)
        VALUES (?, 1, datetime('now'), ?)
      `).run(sessionToken, expiresAt.toISOString());
    }

    return {
      success: true,
      message: 'Login successful',
      sessionToken,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        last_login: user.last_login,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Logout user
export function logout(sessionToken?: string): { success: boolean; message: string } {
  try {
    if (sessionToken) {
      const db = getDatabase();
      db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(sessionToken);
    }

    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Logout failed' };
  }
}

// Validate session token
export function validateSession(sessionToken: string): {
  valid: boolean;
  user?: AuthUser;
} {
  try {
    const db = getDatabase();

    // Get session
    const session = db.prepare(`
      SELECT s.id, s.expires_at, u.id as user_id, u.username, u.created_at, u.last_login
      FROM auth_sessions s
      JOIN auth_user u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(sessionToken) as {
      id: string;
      expires_at: string;
      user_id: number;
      username: string;
      created_at: string;
      last_login: string | null;
    } | undefined;

    if (!session) {
      return { valid: false };
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired session
      db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(sessionToken);
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        id: session.user_id,
        username: session.username,
        created_at: session.created_at,
        last_login: session.last_login,
      },
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false };
  }
}

// Change password
export async function changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDatabase();

    // Get current user
    const user = db.prepare('SELECT password_hash FROM auth_user WHERE id = 1').get() as
      | { password_hash: string }
      | undefined;

    if (!user) {
      return { success: false, message: 'No account exists' };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password_hash);

    if (!isValidPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Validate new password
    if (!data.newPassword || data.newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters' };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

    // Update password
    db.prepare('UPDATE auth_user SET password_hash = ? WHERE id = 1').run(newPasswordHash);

    // Invalidate all sessions
    db.prepare('DELETE FROM auth_sessions WHERE user_id = 1').run();

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: `Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Clean up expired sessions (called periodically)
export function cleanupExpiredSessions(): void {
  try {
    const db = getDatabase();
    const result = db.prepare(`
      DELETE FROM auth_sessions WHERE expires_at < datetime('now')
    `).run();

    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired sessions`);
    }
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}
