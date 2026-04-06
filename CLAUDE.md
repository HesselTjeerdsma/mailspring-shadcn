# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# --- Original UI (React 16 + Reflux + LESS) ---

# Run the original app in development mode
pnpm start

# Run with specific language locale
pnpm start -- --lang=de

# Run linting (prettier + eslint)
pnpm lint

# Run all tests
pnpm test

# Run window-specific tests
pnpm test-window

# TypeScript type checking (original app) in watch mode
pnpm tsc-watch

# Build original app for production
pnpm build

# --- New UI (React 18 + shadcn/ui + Tailwind CSS) ---

# Dev server with HMR (standalone, uses mock data, no Electron)
pnpm dev:ui

# Build new UI to dist/
pnpm build:ui

# Preview production build
pnpm preview:ui

# Run Electron with new UI (builds first, uses --new-ui flag)
pnpm start:new-ui

# TypeScript type checking (new UI)
pnpm typecheck:ui
```

## Architecture Overview

Mailspring is an Electron-based email client. The project has two coexisting frontend stacks:

1. **Original UI** (`app/`) — React 16, Reflux stores, LESS styles, Grunt build
2. **New UI** (`src/`) — React 18, Zustand stores, Tailwind CSS + shadcn/ui, Vite build

Both share the same backend: a C++ sync engine (`mailsync`) that handles IMAP/SMTP, and a read-only SQLite database accessed via `better-sqlite3`.

### Key Directories

- **`app/`** — Original application (kept intact as reference and for the Electron main process)
  - `src/browser/` — Electron main process (application lifecycle, window management, auto-updates)
  - `src/flux/` — Flux-based state management (actions, stores, models, tasks)
  - `src/flux/models/` — Data models: Thread, Message, Contact, Account, Folder, Label, etc.
  - `src/flux/stores/` — Application state: DatabaseStore, AccountStore, CategoryStore, etc.
  - `src/flux/tasks/` — Async operations: SendDraftTask, ChangeFolderTask, etc.
  - `src/flux/actions.ts` — Application-wide action dispatcher
  - `src/components/` — Original React 16 UI components
  - `src/global/` — Global exports (`mailspring-exports`, `mailspring-component-kit`)
  - `static/` — HTML entry points (`index.html` for original, `index-v2.html` for new UI)
  - `internal_packages/` — Built-in plugins implementing features

- **`src/`** — New frontend (React 18 + shadcn/ui + Tailwind)
  - `components/ui/` — shadcn/ui primitives (Button, ScrollArea, Separator, Tooltip)
  - `components/layout/` — App shell (AppLayout, Sidebar, Toolbar)
  - `components/threads/` — Thread list view
  - `components/messages/` — Message detail view
  - `components/composer/` — Email composer (planned)
  - `components/search/` — Search interface (planned)
  - `components/settings/` — Settings panel (planned)
  - `components/ai/` — AI feature components (planned)
  - `stores/` — Zustand stores wrapping the existing data layer
  - `hooks/` — Custom React hooks
  - `lib/` — Utilities, Mailspring bridge, helpers
  - `types/` — TypeScript type definitions for Mailspring models
  - `styles/` — Tailwind CSS theme and global styles

- **`mailsync/`** — C++ sync engine (git submodule, **DO NOT MODIFY**)

> **IMPORTANT:** When searching for usages across the codebase, search both `app/src/`, `app/internal_packages/`, and `src/`. The original code lives in `app/`, the new UI lives in `src/`.

### New UI Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 18 | Strict mode, functional components only |
| State | Zustand | Wraps existing Reflux stores via `window.$m` bridge |
| Styling | Tailwind CSS 4 + shadcn/ui | Design tokens in `src/styles/globals.css` |
| Bundler | Vite 8 | Config in `vite.config.ts`, builds to `dist/` |
| Icons | Lucide React | Consistent icon set |
| Layout | react-resizable-panels v4 | Three-column resizable layout |
| Types | TypeScript (strict) | Separate tsconfig at `src/tsconfig.json` |

### Bridge Layer (`src/lib/`)

The new UI communicates with the existing Mailspring infrastructure through a bridge:

- **`mailspring-exports.ts`** — Provides typed lazy accessors to the global `window.$m` object (which is set by the original bootstrap). Exposes `getAccountStore()`, `getDatabaseStore()`, `getActions()`, etc.
- **`mailspring-provider.tsx`** — React context that gates the app on bridge readiness. When running standalone via `pnpm dev:ui`, stores use mock data. When running inside Electron via `pnpm start:new-ui`, stores connect to real Reflux stores.

### Zustand Stores (`src/stores/`)

Each Zustand store wraps a corresponding Reflux store:

| Zustand Store | Wraps | Purpose |
|--------------|-------|---------|
| `useAccountStore` | `AccountStore` | Accounts list, selected account |
| `useMailboxStore` | `CategoryStore` | Folders, labels, selected category |
| `useFocusStore` | `FocusedContentStore` | Currently focused thread/message |
| `useUIStore` | (standalone) | Layout mode, sidebar, theme, command palette |

Stores subscribe to Reflux store `trigger()` events and sync state automatically.

### Electron Integration

The `--new-ui` command-line flag switches between old and new UI:

- **`app/src/browser/window-manager.ts`** — Selects `window-bootstrap-v2.ts` as bootstrap script when `--new-ui` is present
- **`app/src/browser/mailspring-window.ts`** — Loads `index-v2.html` instead of `index.html` when `--new-ui` is present
- **`app/src/window-bootstrap-v2.ts`** — Initializes AppEnv (which sets up all Reflux stores, MailsyncBridge, and DatabaseStore), then the Vite-built bundle is loaded from `dist/`
- **`app/static/index-v2.html`** — HTML entry point that runs the old bootstrap for infrastructure, then loads the new React 18 app from `dist/`

```
┌─ Electron Main Process ─────────────────────────────┐
│  app/src/browser/main.js                             │
│  └─ application.ts → WindowManager                   │
│       └─ --new-ui? → window-bootstrap-v2.ts          │
│                       └─ AppEnv (stores, mailsync)   │
│                       └─ loads dist/ (Vite bundle)   │
├──────────────────────────────────────────────────────┤
│  New Renderer (React 18)                             │
│  src/main.tsx → App → AppLayout                      │
│  └─ Zustand stores ← window.$m ← Reflux stores      │
│                                    ↕                 │
│                              MailsyncBridge           │
│                                    ↕                 │
│                           mailsync (C++ process)     │
└──────────────────────────────────────────────────────┘
```

## Core Data Flow: Sync Engine, Tasks, and Observable Database

**Important:** The UI is read-only with respect to the database. All database modifications happen in the C++ sync engine (Mailspring-Sync). The Electron app requests changes via Tasks, and the sync engine streams entity changes back to create a real-time UI.

### Sync Engine Communication (`mailsync-process.ts`, `mailsync-bridge.ts`)

The sync engine is a separate C++ process spawned per account:

1. **Electron → Sync Engine**: JSON messages sent via stdin (task requests, commands)
2. **Sync Engine → Electron**: Newline-delimited JSON streamed via stdout (database change deltas)

```
┌─────────────────┐         stdin (JSON)          ┌──────────────────┐
│   Electron UI   │ ──────────────────────────────▶│  Mailspring-Sync │
│  (TypeScript)   │                                │      (C++)       │
│                 │ ◀────────────────────────────── │                  │
└─────────────────┘    stdout (JSON deltas)        └──────────────────┘
```

The `MailsyncBridge` (in main window only) manages sync process lifecycle, listens to `Actions.queueTask`, and forwards tasks to the appropriate account's sync process.

### Task System (`flux/tasks/`)

Tasks represent operations the user wants to perform (send email, star thread, move to folder). They are **persisted models** stored in the database.

**Task Lifecycle:**
1. UI calls `Actions.queueTask(new SomeTask({...}))`
2. `MailsyncBridge._onQueueTask()` validates and sends to sync engine via stdin
3. Sync engine executes the task (local changes + remote API calls)
4. Sync engine persists task status updates and emits deltas
5. Task completion triggers `onSuccess()` or `onError()` callbacks

**Task States** (`flux/tasks/task.ts`):
- `local` - Not yet executed
- `remote` - Local phase complete, waiting for remote
- `complete` - Finished successfully
- `cancelled` - Cancelled before completion

**Key Task Classes:**
- `SendDraftTask`, `DestroyDraftTask` - Email composition
- `ChangeLabelsTask`, `ChangeFolderTask` - Organization
- `ChangeStarredTask`, `ChangeUnreadTask` - Status flags
- `SyncbackMetadataTask` - Plugin metadata sync
- `SyncbackEventTask` - Calendar event sync

**Undoable Tasks:**

Tasks can support undo/redo by implementing `canBeUndone` and `createUndoTask()`. The `UndoRedoStore` automatically registers tasks with `canBeUndone = true` for undo.

Two patterns exist:
1. **Toggle pattern** (`ChangeStarredTask`): Undo simply flips a boolean flag
2. **Snapshot pattern** (`SyncbackMetadataTask`, `SyncbackEventTask`): Store original state in `undoData`, swap on undo

```typescript
// Snapshot pattern example
const undoData = { ics: event.ics, recurrenceStart: event.recurrenceStart };
event.ics = newIcs;  // Modify after capturing
Actions.queueTask(SyncbackEventTask.forUpdating({ event, undoData, description: 'Edit event' }));
```

See `docs/undo-redo-task-pattern.md` for detailed implementation guide.

### Task Queue (`flux/stores/task-queue.ts`)

The TaskQueue store observes Task model changes from the database and provides:
- `queue()` - Active tasks
- `completed()` - Finished tasks
- `waitForPerformLocal(task)` - Promise that resolves when task runs locally
- `waitForPerformRemote(task)` - Promise that resolves when task fully completes

### Observable Database Pattern

**Database is read-only in Electron** (`flux/stores/database-store.ts`):
- `DatabaseStore.inTransaction()` throws - writes are not allowed
- Uses SQLite in WAL mode via better-sqlite3 for concurrent reads
- The sync engine exclusively handles writes

**Change Records** (`flux/stores/database-change-record.ts`):

When the sync engine modifies data, it emits JSON deltas that become `DatabaseChangeRecord` objects:
```typescript
{
  type: 'persist' | 'unpersist',
  objectClass: 'Thread' | 'Message' | ...,
  objects: Model[],
  objectsRawJSON: object[]
}
```

**Reactive Queries** (`flux/models/query-subscription.ts`):

`QuerySubscription` provides live-updating query results:
```typescript
// Subscribe to all unread threads
const subscription = new QuerySubscription(
  DatabaseStore.findAll(Thread).where({ unread: true })
);
subscription.addCallback((threads) => this.setState({ threads }));

// Subscription automatically updates when DatabaseStore triggers
```

**Observable Integration** (`Rx.Observable.fromQuery`):

Wrap queries as RxJS observables for reactive UI updates:
```typescript
Rx.Observable.fromQuery(DatabaseStore.findAll(Thread))
  .subscribe(threads => this.updateUI(threads));
```

**ObservableListDataSource** (`flux/stores/observable-list-data-source.ts`):

Adapts QuerySubscription for virtualized list components (MultiselectList), supporting:
- Windowed/paginated data loading
- Selection state management
- Automatic updates from database changes

### Data Flow Summary

```
User Action → Actions.queueTask() → MailsyncBridge → stdin → Sync Engine
                                                              │
                                                              ▼
UI Updates ← QuerySubscription ← DatabaseStore.trigger() ← stdout deltas
```

In the new UI, the same flow applies but Zustand stores subscribe to Reflux store triggers instead of using QuerySubscription directly.

## Design System (New UI)

The new UI uses Tailwind CSS 4 with custom design tokens defined in `src/styles/globals.css`:

- **Font**: Inter (with system-ui fallback)
- **Radius**: `rounded-md` (6px) for inputs/buttons, `rounded-lg` (8px) for cards
- **Colors**: Neutral gray scale with CSS custom properties for light/dark mode
- **Dark mode**: Supported via `.dark` class on `<html>` + Tailwind `dark:` variant
- **Scrollbars**: Custom styled, 6px width
- **Aesthetic**: Clean and minimal, inspired by Linear (monochrome + accent, good typography, generous whitespace)

shadcn/ui components are installed in `src/components/ui/` and follow the standard shadcn/ui patterns with the `cn()` utility from `src/lib/utils.ts`.

## Development Notes

- Hot reload is available via `CTRL+R` (Windows/Linux) or `CMD+R` (macOS) in the original UI
- The new UI uses Vite HMR when running `pnpm dev:ui`
- Dev tools accessible via Menu > Developer > Toggle Developer Tools
- In dev tools console, `$m` provides access to `mailspring-exports` for debugging
- Dev mode data is stored separately (e.g., `~/.config/Mailspring-dev/` on Linux)
- The project uses pnpm with `shamefully-hoist=true` (required for Electron's `nodeIntegration`) and `strict-peer-dependencies=false` (for mixed React 16/18 during migration)

## Claude Hooks

### after_edit

Run linting after modifying TypeScript or JavaScript files.

```json
{
  "hooks": {
    "after_edit": [
      {
        "command": "pnpm lint",
        "file_paths": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
      }
    ]
  }
}
```
