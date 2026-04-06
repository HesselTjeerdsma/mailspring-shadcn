import { create } from 'zustand';

type LayoutMode = 'split' | 'splitVertical' | 'list';
type Theme = 'light' | 'dark' | 'system';

interface UIStoreState {
  /** Three-pane layout mode */
  layoutMode: LayoutMode;
  /** Sidebar collapsed */
  sidebarCollapsed: boolean;
  /** Theme preference */
  theme: Theme;
  /** Resolved dark mode (from theme + system) */
  isDark: boolean;
  /** Command palette open */
  commandPaletteOpen: boolean;
  /** Compose window open */
  composeOpen: boolean;

  setLayoutMode: (mode: LayoutMode) => void;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setComposeOpen: (open: boolean) => void;
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  // system
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

export const useUIStore = create<UIStoreState>((set, get) => ({
  layoutMode: 'split',
  sidebarCollapsed: false,
  theme: 'light',
  isDark: false,
  commandPaletteOpen: false,
  composeOpen: false,

  setLayoutMode: (mode) => set({ layoutMode: mode }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTheme: (theme) => {
    const isDark = resolveIsDark(theme);
    // Toggle the dark class on document root
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    set({ theme, isDark });
  },
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setComposeOpen: (open) => set({ composeOpen: open }),
}));
