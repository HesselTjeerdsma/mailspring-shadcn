import { create } from 'zustand';
import type { Thread, Message } from '@/types/models';
import {
  isMailspringAvailable,
  getFocusedContentStore,
  getActions,
} from '@/lib/mailspring-exports';

interface FocusStoreState {
  focusedThread: Thread | null;
  focusedMessage: Message | null;
  keyboardCursorThread: Thread | null;

  setFocusedThread: (thread: Thread | null) => void;
  setFocusedMessage: (message: Message | null) => void;
  refresh: () => void;
}

function loadFocused(): Pick<
  FocusStoreState,
  'focusedThread' | 'focusedMessage' | 'keyboardCursorThread'
> {
  if (!isMailspringAvailable()) {
    return { focusedThread: null, focusedMessage: null, keyboardCursorThread: null };
  }
  try {
    const store = getFocusedContentStore();
    return {
      focusedThread: store.focused('thread') ?? null,
      focusedMessage: store.focused('message') ?? null,
      keyboardCursorThread: store.keyboardCursor('thread') ?? null,
    };
  } catch {
    return { focusedThread: null, focusedMessage: null, keyboardCursorThread: null };
  }
}

export const useFocusStore = create<FocusStoreState>((set) => {
  if (isMailspringAvailable()) {
    try {
      getFocusedContentStore().listen(() => {
        set(loadFocused());
      });
    } catch {
      // Will populate on refresh
    }
  }

  return {
    ...loadFocused(),

    setFocusedThread: (thread) => {
      if (isMailspringAvailable() && thread) {
        getActions().setFocus({ collection: 'thread', item: thread });
      }
      set({ focusedThread: thread });
    },

    setFocusedMessage: (message) => {
      if (isMailspringAvailable() && message) {
        getActions().setFocus({ collection: 'message', item: message });
      }
      set({ focusedMessage: message });
    },

    refresh: () => set(loadFocused()),
  };
});
