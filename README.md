# Electron Offline Business App Template

A production-ready template for building offline-first desktop business applications with Electron, React, and SQLite.

## Features

- **Local SQLite Database** - All data stored locally with automatic backups
- **Single-User Authentication** - Simple username/password login with "remember me" support
- **Automatic Backups** - Configurable backup system (startup, periodic, on-close)
- **Manual Backups** - Export database to any location
- **Dark/Light Theme** - Built-in theme support with CSS variables
- **22+ UI Components** - shadcn/ui components included
- **TypeScript** - Full type safety throughout
- **React Query** - Server state management for data fetching
- **Form Validation** - React Hook Form + Zod schema validation

## Quick Start

1. **Clone or copy this template**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   # Windows
   npm run build:win

   # macOS
   npm run build:mac

   # Linux
   npm run build:linux
   ```

## Project Structure

```
electron-offline-template/
├── electron/                    # Electron main process
│   ├── main.ts                 # App entry, window, IPC handlers
│   ├── preload.ts              # Context bridge API
│   ├── types.ts                # TypeScript types
│   └── database/
│       ├── db.ts               # SQLite connection
│       ├── migrations.ts       # Database schema
│       ├── auth.ts             # Authentication handlers
│       ├── items.ts            # Example CRUD handlers
│       └── backup.ts           # Backup system
├── src/                         # React frontend
│   ├── main.tsx                # React entry
│   ├── App.tsx                 # Router & providers
│   ├── index.css               # Global styles & theme
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # AppLayout
│   │   └── auth/               # Login, Setup, AuthGuard
│   ├── pages/                  # Route pages
│   ├── hooks/                  # React hooks
│   ├── contexts/               # React contexts
│   └── lib/                    # Utils & types
├── app.config.ts               # Central configuration
├── package.json
├── vite.config.ts
├── electron-builder.json
└── tailwind.config.ts
```

## Configuration

Edit `app.config.ts` to customize your application:

```typescript
export const AppConfig = {
  // App Identity
  name: 'My Business App',
  shortName: 'MyApp',
  version: '1.0.0',

  // Database
  database: {
    name: 'app-data.db',
    backupPrefix: 'app-backup',
  },

  // Backup Settings
  backup: {
    maxBackups: 7,
    periodicIntervalHours: 6,
    startupThresholdHours: 24,
  },

  // Auth Settings
  auth: {
    sessionExpiryDays: 30,
    rememberMeEnabled: true,
  },

  // Navigation
  navigation: [
    { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/items', label: 'Items', icon: 'Package' },
    { href: '/settings', label: 'Settings', icon: 'Settings' },
  ],
};
```

## Adding UI Components

This template uses [shadcn/ui](https://ui.shadcn.com). To add more components:

```bash
npx shadcn@latest add calendar
npx shadcn@latest add chart
npx shadcn@latest add accordion
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (electron-builder) |
| `npm run build:win` | Build Windows installer (electron-builder) |
| `npm run build:mac` | Build macOS app (electron-builder) |
| `npm run build:linux` | Build Linux packages (electron-builder) |
| `npm run start` | Start with Electron Forge |
| `npm run package` | Package app with Electron Forge |
| `npm run make` | Create distributables with Electron Forge |
| `npm run type-check` | Run TypeScript type checking |

### Packaging Options

You have two options for building your app:

**1. Electron Builder** (simpler, recommended for most cases):
```bash
npm run build:win   # Creates NSIS installer
```

**2. Electron Forge** (more control, better for advanced use):
```bash
npm run make        # Creates platform-specific packages
```

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **better-sqlite3** - SQLite database
- **React Router** - Client-side routing (HashRouter)
- **React Query** - Data fetching & caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **bcryptjs** - Password hashing

## Data Storage

- **Database**: `%APPDATA%/{app-name}/app-data.db` (Windows)
- **Backups**: `%APPDATA%/{app-name}/backups/`

## Security

- Passwords are hashed using bcryptjs (12 salt rounds)
- Session tokens for "remember me" feature
- Context isolation enabled in Electron
- No remote code execution

## License

MIT
