import { contextBridge, ipcRenderer } from 'electron';
import type {
  SetupData,
  LoginData,
  LoginResult,
  ChangePasswordData,
  AuthUser,
  Item,
  Category,
  ItemFilters,
  CreateItemData,
  UpdateItemData,
  DashboardStats,
  BackupResult,
  BackupInfo,
} from './types';

// Define the API structure
const electronAPI = {
  // ============================================
  // AUTH API
  // ============================================
  auth: {
    checkSetup: (): Promise<boolean> => ipcRenderer.invoke('auth:checkSetup'),

    setup: (data: SetupData): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('auth:setup', data),

    login: (data: LoginData): Promise<LoginResult> => ipcRenderer.invoke('auth:login', data),

    logout: (sessionToken?: string): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('auth:logout', sessionToken),

    validateSession: (sessionToken: string): Promise<{ valid: boolean; user?: AuthUser }> =>
      ipcRenderer.invoke('auth:validateSession', sessionToken),

    changePassword: (data: ChangePasswordData): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('auth:changePassword', data),
  },

  // ============================================
  // ITEMS API
  // ============================================
  items: {
    getAll: (filters?: ItemFilters): Promise<Item[]> => ipcRenderer.invoke('items:getAll', filters),

    getById: (id: string): Promise<Item | null> => ipcRenderer.invoke('items:getById', id),

    create: (data: CreateItemData): Promise<{ success: boolean; message: string; item?: Item }> =>
      ipcRenderer.invoke('items:create', data),

    update: (data: UpdateItemData): Promise<{ success: boolean; message: string; item?: Item }> =>
      ipcRenderer.invoke('items:update', data),

    delete: (id: string): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('items:delete', id),
  },

  // ============================================
  // CATEGORIES API
  // ============================================
  categories: {
    getAll: (): Promise<Category[]> => ipcRenderer.invoke('categories:getAll'),

    create: (name: string): Promise<{ success: boolean; message: string; category?: Category }> =>
      ipcRenderer.invoke('categories:create', name),

    delete: (id: string): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('categories:delete', id),
  },

  // ============================================
  // DASHBOARD API
  // ============================================
  dashboard: {
    getStats: (): Promise<DashboardStats> => ipcRenderer.invoke('dashboard:getStats'),

    getRecentItems: (limit?: number): Promise<Item[]> => ipcRenderer.invoke('dashboard:getRecentItems', limit),
  },

  // ============================================
  // BACKUP API
  // ============================================
  backup: {
    create: (): Promise<BackupResult> => ipcRenderer.invoke('backup:create'),

    createManual: (): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('backup:createManual'),

    getInfo: (): Promise<BackupInfo> => ipcRenderer.invoke('backup:getInfo'),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer process
export type ElectronAPI = typeof electronAPI;
