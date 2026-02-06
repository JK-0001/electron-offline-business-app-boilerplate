import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';

// ============================================
// TYPES
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
// ITEM HANDLERS
// ============================================

export function getAllItems(filters?: ItemFilters): Item[] {
  const db = getDatabase();

  let query = `
    SELECT i.*, c.name as category_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.search) {
    query += ' AND (i.name LIKE ? OR i.description LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters?.category_id) {
    query += ' AND i.category_id = ?';
    params.push(filters.category_id);
  }

  if (filters?.status && filters.status !== 'all') {
    query += ' AND i.status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY i.created_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params) as Item[];
}

export function getItemById(id: string): Item | null {
  const db = getDatabase();

  const item = db.prepare(`
    SELECT i.*, c.name as category_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.id = ?
  `).get(id) as Item | undefined;

  return item || null;
}

export function createItem(data: CreateItemData): { success: boolean; message: string; item?: Item } {
  try {
    const db = getDatabase();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO items (id, name, description, category_id, quantity, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      id,
      data.name,
      data.description || null,
      data.category_id || null,
      data.quantity || 0,
      data.status || 'active'
    );

    const item = getItemById(id);

    return {
      success: true,
      message: 'Item created successfully',
      item: item || undefined,
    };
  } catch (error) {
    console.error('Error creating item:', error);
    return {
      success: false,
      message: `Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function updateItem(data: UpdateItemData): { success: boolean; message: string; item?: Item } {
  try {
    const db = getDatabase();

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(data.category_id || null);
    }

    if (data.quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(data.quantity);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (updates.length === 0) {
      return { success: false, message: 'No fields to update' };
    }

    updates.push("updated_at = datetime('now')");
    params.push(data.id);

    const stmt = db.prepare(`
      UPDATE items SET ${updates.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...params);

    if (result.changes === 0) {
      return { success: false, message: 'Item not found' };
    }

    const item = getItemById(data.id);

    return {
      success: true,
      message: 'Item updated successfully',
      item: item || undefined,
    };
  } catch (error) {
    console.error('Error updating item:', error);
    return {
      success: false,
      message: `Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function deleteItem(id: string): { success: boolean; message: string } {
  try {
    const db = getDatabase();

    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);

    if (result.changes === 0) {
      return { success: false, message: 'Item not found' };
    }

    return { success: true, message: 'Item deleted successfully' };
  } catch (error) {
    console.error('Error deleting item:', error);
    return {
      success: false,
      message: `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================
// CATEGORY HANDLERS
// ============================================

export function getAllCategories(): Category[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
}

export function createCategory(name: string): { success: boolean; message: string; category?: Category } {
  try {
    const db = getDatabase();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO categories (id, name, created_at)
      VALUES (?, ?, datetime('now'))
    `);

    stmt.run(id, name.trim());

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category;

    return {
      success: true,
      message: 'Category created successfully',
      category,
    };
  } catch (error) {
    console.error('Error creating category:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return { success: false, message: 'Category already exists' };
    }

    return {
      success: false,
      message: `Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function deleteCategory(id: string): { success: boolean; message: string } {
  try {
    const db = getDatabase();

    // Check if category has items
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM items WHERE category_id = ?').get(id) as {
      count: number;
    };

    if (itemCount.count > 0) {
      return {
        success: false,
        message: `Cannot delete category. ${itemCount.count} items are using this category.`,
      };
    }

    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    if (result.changes === 0) {
      return { success: false, message: 'Category not found' };
    }

    return { success: true, message: 'Category deleted successfully' };
  } catch (error) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      message: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================
// DASHBOARD STATS
// ============================================

export function getDashboardStats(): DashboardStats {
  const db = getDatabase();

  const totalItems = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
  const activeItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE status = 'active'").get() as {
    count: number;
  };
  const inactiveItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE status = 'inactive'").get() as {
    count: number;
  };
  const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  return {
    totalItems: totalItems.count,
    activeItems: activeItems.count,
    inactiveItems: inactiveItems.count,
    totalCategories: totalCategories.count,
  };
}

export function getRecentItems(limit: number = 5): Item[] {
  const db = getDatabase();

  return db.prepare(`
    SELECT i.*, c.name as category_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    ORDER BY i.created_at DESC
    LIMIT ?
  `).all(limit) as Item[];
}
