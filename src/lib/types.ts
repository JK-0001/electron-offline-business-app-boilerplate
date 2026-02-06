// Re-export types from electron for use in renderer
export interface AuthUser {
  id: number;
  username: string;
  created_at: string;
  last_login: string | null;
}

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

export interface DashboardStats {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  totalCategories: number;
}

export interface BackupInfo {
  backupDir: string;
  lastBackupTime: number | null;
  backupCount: number;
}
