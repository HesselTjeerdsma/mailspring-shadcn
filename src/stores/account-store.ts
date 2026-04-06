import { create } from 'zustand';
import type { Account } from '@/types/models';
import { isMailspringAvailable, getAccountStore } from '@/lib/mailspring-exports';

interface AccountStoreState {
  accounts: Account[];
  selectedAccountId: string | null;

  // Actions
  selectAccount: (accountId: string | null) => void;
  refresh: () => void;
}

function loadAccounts(): Account[] {
  if (!isMailspringAvailable()) return [];
  try {
    return getAccountStore().accounts() ?? [];
  } catch {
    return [];
  }
}

export const useAccountStore = create<AccountStoreState>((set) => {
  // Subscribe to the existing Reflux store when in Electron
  if (isMailspringAvailable()) {
    try {
      getAccountStore().listen(() => {
        set({ accounts: loadAccounts() });
      });
    } catch {
      // Not yet available, will be populated on refresh
    }
  }

  return {
    accounts: loadAccounts(),
    selectedAccountId: null,

    selectAccount: (accountId) => set({ selectedAccountId: accountId }),
    refresh: () => set({ accounts: loadAccounts() }),
  };
});
