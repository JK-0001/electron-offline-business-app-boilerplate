// ============================================
// AUTH TYPES
// ============================================

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

// ============================================
// ITEM TYPES
// ============================================

export interface Item {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name?: string;
  quantity: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface ItemFilters {
  search?: string;
  category_id?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface CreateItemData {
  name: string;
  description?: string;
  category_id?: string;
  quantity?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateItemData {
  id: string;
  name?: string;
  description?: string;
  category_id?: string;
  quantity?: number;
  status?: 'active' | 'inactive';
}

export interface DashboardStats {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  totalCategories: number;
}

// ============================================
// BACKUP TYPES
// ============================================

export interface BackupResult {
  success: boolean;
  message: string;
  filePath?: string;
}

export interface BackupInfo {
  backupDir: string;
  lastBackupTime: number | null;
  backupCount: number;
}

// ============================================
// API RESULT TYPES
// ============================================

export interface ApiResult<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
