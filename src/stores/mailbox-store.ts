import { create } from 'zustand';
import type { Category } from '@/types/models';
import { isMailspringAvailable, getCategoryStore } from '@/lib/mailspring-exports';

interface MailboxStoreState {
  /** Currently selected category (folder/label) */
  selectedCategory: Category | null;
  /** Standard categories (inbox, sent, drafts, etc.) per account */
  standardCategories: Record<string, Category[]>;
  /** User-created categories per account */
  userCategories: Record<string, Category[]>;

  selectCategory: (category: Category) => void;
  refresh: () => void;
}

function loadCategories(): {
  standardCategories: Record<string, Category[]>;
  userCategories: Record<string, Category[]>;
} {
  if (!isMailspringAvailable()) {
    return { standardCategories: {}, userCategories: {} };
  }
  try {
    const store = getCategoryStore();
    // CategoryStore doesn't easily expose per-account lists without account IDs,
    // so we'll populate lazily as accounts become available
    return {
      standardCategories: {},
      userCategories: {},
    };
  } catch {
    return { standardCategories: {}, userCategories: {} };
  }
}

export const useMailboxStore = create<MailboxStoreState>((set) => {
  if (isMailspringAvailable()) {
    try {
      getCategoryStore().listen(() => {
        set(loadCategories());
      });
    } catch {
      // Will populate on refresh
    }
  }

  const initial = loadCategories();

  return {
    ...initial,
    selectedCategory: null,

    selectCategory: (category) => set({ selectedCategory: category }),
    refresh: () => set(loadCategories()),
  };
});
