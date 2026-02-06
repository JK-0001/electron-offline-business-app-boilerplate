# Customization Guide

This guide explains how to customize the template for your specific business application.

## 1. Changing App Name & Branding

### Update app.config.ts
```typescript
export const AppConfig = {
  name: 'Your App Name',
  shortName: 'YourApp',
  description: 'Your app description',
  version: '1.0.0',
  // ...
};
```

### Update package.json
```json
{
  "name": "your-app-name",
  "productName": "Your App Name",
  "description": "Your app description",
  "author": "Your Name"
}
```

### Update electron-builder.json
```json
{
  "appId": "com.yourcompany.yourapp",
  "productName": "Your App Name"
}
```

### Update index.html
```html
<title>Your App Name</title>
<meta name="description" content="Your app description" />
```

### Replace Icons
Replace the files in `build-resources/`:
- `icon.png` - 512x512 PNG for Linux/macOS
- `icon.ico` - Windows icon (use an ICO converter)

---

## 2. Modifying the Color Theme

### Quick Theme Change
Edit `src/index.css` and modify the CSS variables in `:root`:

```css
:root {
  /* Change primary color */
  --primary: 142 76% 36%;  /* Green */
  --ring: 142 76% 36%;
  --sidebar-primary: 142 76% 36%;
}
```

### Theme Presets Available
Uncomment one of the preset themes in `src/index.css`:
- Blue (default)
- Green
- Orange
- Purple
- Slate

### Custom Theme
Create your own by adjusting HSL values:
```css
:root {
  --primary: [hue] [saturation%] [lightness%];
}
```

Use [HSL Color Picker](https://hslpicker.com) to find your colors.

---

## 3. Adding New Database Tables

### Step 1: Update migrations.ts
```typescript
// electron/database/migrations.ts

// Add your table
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add indexes if needed
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
`);
```

### Step 2: Create Handlers
```typescript
// electron/database/customers.ts

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export function getAllCustomers(): Customer[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM customers ORDER BY name').all() as Customer[];
}

export function createCustomer(data: { name: string; email?: string; phone?: string }) {
  const db = getDatabase();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO customers (id, name, email, phone)
    VALUES (?, ?, ?, ?)
  `).run(id, data.name, data.email || null, data.phone || null);

  return { success: true, id };
}

// Add more handlers as needed...
```

### Step 3: Register IPC Handlers
```typescript
// electron/main.ts

import * as customerHandlers from './database/customers';

// Add IPC handlers
ipcMain.handle('customers:getAll', () => customerHandlers.getAllCustomers());
ipcMain.handle('customers:create', (_, data) => customerHandlers.createCustomer(data));
```

### Step 4: Update Preload
```typescript
// electron/preload.ts

customers: {
  getAll: () => ipcRenderer.invoke('customers:getAll'),
  create: (data) => ipcRenderer.invoke('customers:create', data),
},
```

### Step 5: Create React Hook
```typescript
// src/hooks/useCustomers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => window.electronAPI.customers.getAll(),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => window.electronAPI.customers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
```

---

## 4. Adding New Pages/Routes

### Step 1: Create the Page Component
```tsx
// src/pages/Customers.tsx

import { useCustomers } from '@/hooks/useCustomers';

export function Customers() {
  const { data: customers, isLoading } = useCustomers();

  return (
    <div>
      <h1>Customers</h1>
      {/* Your UI here */}
    </div>
  );
}
```

### Step 2: Add Route in App.tsx
```tsx
// src/App.tsx

import { Customers } from '@/pages/Customers';

// In Routes:
<Route path="/customers" element={<Customers />} />
```

### Step 3: Add to Navigation
```typescript
// app.config.ts

navigation: [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/items', label: 'Items', icon: 'Package' },
  { href: '/customers', label: 'Customers', icon: 'Users' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
],
```

---

## 5. Customizing Backup Settings

### Change Backup Frequency
```typescript
// app.config.ts

backup: {
  maxBackups: 14,              // Keep 14 backups instead of 7
  periodicIntervalHours: 12,   // Backup every 12 hours instead of 6
  startupThresholdHours: 48,   // Only backup on startup if >48h old
},
```

### Disable Automatic Backups
Comment out in `electron/main.ts`:
```typescript
// checkAndCreateBackupOnStartup();
// startPeriodicBackup();
```

---

## 6. Extending Authentication

### Add User Profile Fields
```typescript
// electron/database/migrations.ts

db.exec(`
  ALTER TABLE auth_user ADD COLUMN display_name TEXT;
  ALTER TABLE auth_user ADD COLUMN email TEXT;
`);
```

### Add Profile Update Handler
```typescript
// electron/database/auth.ts

export function updateProfile(data: { displayName?: string; email?: string }) {
  const db = getDatabase();
  db.prepare(`
    UPDATE auth_user SET display_name = ?, email = ? WHERE id = 1
  `).run(data.displayName, data.email);
  return { success: true };
}
```

---

## 7. Adding PDF Export

Install jspdf:
```bash
npm install jspdf jspdf-autotable
```

Create export utility:
```typescript
// src/utils/pdfExport.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(data: any[], filename: string) {
  const doc = new jsPDF();

  autoTable(doc, {
    head: [Object.keys(data[0])],
    body: data.map(item => Object.values(item)),
  });

  doc.save(`${filename}.pdf`);
}
```

---

## 8. Adding Charts

Install recharts (already included in some setups):
```bash
npm install recharts
```

Add chart component:
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function SalesChart({ data }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="hsl(var(--primary))" />
    </BarChart>
  );
}
```

---

## Common Patterns

### Toast Notifications
```tsx
import { toast } from 'sonner';

// Success
toast.success('Item saved successfully');

// Error
toast.error('Failed to save item');

// With description
toast.success('Saved', { description: 'Your changes have been saved.' });
```

### Form with Validation
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### Loading States
```tsx
import { Skeleton } from '@/components/ui/skeleton';

if (isLoading) {
  return <Skeleton className="h-10 w-full" />;
}
```

### Confirmation Dialogs
```tsx
import { AlertDialog, AlertDialogAction, ... } from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
