/**
 * Bootstrap script for the new React 18 + shadcn/ui frontend (v2 UI).
 *
 * This replaces window-bootstrap.ts when running with --new-ui flag.
 * It initializes the core Mailspring infrastructure (AppEnv, MailsyncBridge,
 * DatabaseStore) and then mounts the Vite-built React app.
 *
 * The old UI's React component tree and package system are NOT loaded.
 * Instead, the new Zustand stores access the underlying Reflux stores
 * and models via the window.$m bridge.
 */

// Extend the standard promise class
import './promise-extensions';

import AppEnvClass from './app-env';

// Initialize AppEnv - this sets up all core infrastructure:
// - better-sqlite3 database connection
// - MailsyncBridge for sync engine communication
// - All Reflux stores (AccountStore, CategoryStore, etc.)
// - window.$m = require('mailspring-exports')
window.AppEnv = new AppEnvClass();

// Start the root window initialization.
// In new-ui mode this skips the legacy renderer mount and package activation,
// but still sets up the window shell, keymaps, menus, and bridge infrastructure.
AppEnv.startRootWindow();

// The new UI entry point is loaded separately via the HTML file.
// See app/static/index-v2.html which loads the Vite-built bundle.
