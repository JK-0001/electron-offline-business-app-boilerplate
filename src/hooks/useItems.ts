import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Item, Category, ItemFilters, DashboardStats } from '@/lib/types';

// Query keys
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters?: ItemFilters) => [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
  recentItems: ['dashboard', 'recentItems'] as const,
};

// ============================================
// ITEMS HOOKS
// ============================================

export function useItems(filters?: ItemFilters) {
  return useQuery({
    queryKey: itemKeys.list(filters),
    queryFn: () => window.electronAPI.items.getAll(filters),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => window.electronAPI.items.getById(id),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      category_id?: string;
      quantity?: number;
      status?: 'active' | 'inactive';
    }) => window.electronAPI.items.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.recentItems });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      name?: string;
      description?: string;
      category_id?: string;
      quantity?: number;
      status?: 'active' | 'inactive';
    }) => window.electronAPI.items.update(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => window.electronAPI.items.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.recentItems });
    },
  });
}

// ============================================
// CATEGORIES HOOKS
// ============================================

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => window.electronAPI.categories.getAll(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => window.electronAPI.categories.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => window.electronAPI.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats });
    },
  });
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => window.electronAPI.dashboard.getStats(),
  });
}

export function useRecentItems(limit: number = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentItems,
    queryFn: () => window.electronAPI.dashboard.getRecentItems(limit),
  });
}
