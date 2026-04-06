import { create } from 'zustand';
import type { Thread } from '@/types/models';
import {
  isMailspringAvailable,
  getFocusedPerspectiveStore,
  getDatabaseStore,
} from '@/lib/mailspring-exports';

// Mock data for standalone dev mode (no Electron bridge)
const MOCK_THREADS: Thread[] = [
  {
    id: '1',
    accountId: 'acc1',
    subject: 'Welcome to the new Mailspring',
    snippet:
      'We are excited to announce the complete redesign of Mailspring with a modern stack...',
    unread: true,
    starred: true,
    version: 1,
    folders: [],
    labels: [],
    participants: [
      { id: 'c1', accountId: 'acc1', name: 'Mailspring Team', email: 'team@mailspring.com' },
    ],
    attachmentCount: 0,
    firstMessageTimestamp: Date.now() - 3600000,
    lastMessageReceivedTimestamp: Date.now() - 3600000,
    lastMessageSentTimestamp: 0,
    inAllMail: true,
  },
  {
    id: '2',
    accountId: 'acc1',
    subject: 'Q2 Planning Document',
    snippet:
      'Hi team, I have attached the Q2 planning document for your review. Please take a look...',
    unread: true,
    starred: false,
    version: 1,
    folders: [],
    labels: [],
    participants: [
      { id: 'c2', accountId: 'acc1', name: 'Sarah Chen', email: 'sarah@example.com' },
    ],
    attachmentCount: 2,
    firstMessageTimestamp: Date.now() - 7200000,
    lastMessageReceivedTimestamp: Date.now() - 7200000,
    lastMessageSentTimestamp: 0,
    inAllMail: true,
  },
  {
    id: '3',
    accountId: 'acc1',
    subject: 'Re: Design review feedback',
    snippet:
      'Thanks for the feedback! I will incorporate the changes and share the updated mockups...',
    unread: false,
    starred: false,
    version: 1,
    folders: [],
    labels: [],
    participants: [
      { id: 'c3', accountId: 'acc1', name: 'Alex Rivera', email: 'alex@example.com' },
      { id: 'c4', accountId: 'acc1', name: 'Jordan Park', email: 'jordan@example.com' },
    ],
    attachmentCount: 0,
    firstMessageTimestamp: Date.now() - 86400000,
    lastMessageReceivedTimestamp: Date.now() - 86400000,
    lastMessageSentTimestamp: 0,
    inAllMail: true,
  },
  {
    id: '4',
    accountId: 'acc1',
    subject: 'Invoice #4521 - March 2026',
    snippet:
      'Please find attached the invoice for services rendered in March 2026. Payment is due...',
    unread: false,
    starred: false,
    version: 1,
    folders: [],
    labels: [],
    participants: [
      { id: 'c5', accountId: 'acc1', name: 'Billing', email: 'billing@acme.com' },
    ],
    attachmentCount: 1,
    firstMessageTimestamp: Date.now() - 172800000,
    lastMessageReceivedTimestamp: Date.now() - 172800000,
    lastMessageSentTimestamp: 0,
    inAllMail: true,
  },
  {
    id: '5',
    accountId: 'acc1',
    subject: 'Weekend hiking trip',
    snippet:
      "Hey! Are you still up for the hiking trip this weekend? The weather forecast looks great...",
    unread: false,
    starred: true,
    version: 1,
    folders: [],
    labels: [],
    participants: [
      { id: 'c6', accountId: 'acc1', name: 'Emma Wilson', email: 'emma@example.com' },
    ],
    attachmentCount: 0,
    firstMessageTimestamp: Date.now() - 259200000,
    lastMessageReceivedTimestamp: Date.now() - 259200000,
    lastMessageSentTimestamp: 0,
    inAllMail: true,
  },
];

interface ThreadStoreState {
  threads: Thread[];
  loading: boolean;
  perspectiveName: string;
}

// Keep subscription state outside Zustand to avoid re-render loops
let _subscription: any = null;
let _subscriptionCallback: ((result: any) => void) | null = null;
let _perspectiveUnlisten: (() => void) | null = null;
let _dbUnlisten: (() => void) | null = null;

function teardown() {
  if (_subscriptionCallback && _subscription) {
    try {
      _subscription.removeCallback(_subscriptionCallback);
    } catch (err) {
      console.warn('[ThreadStore] teardown removeCallback failed:', err);
    }
  }
  _subscription = null;
  _subscriptionCallback = null;
}

function getPerspectiveName(perspective: any): string {
  try {
    if (perspective.name) return perspective.name;
    const role = perspective.categoriesSharedRole?.();
    if (role) return role.charAt(0).toUpperCase() + role.slice(1);
  } catch {
    // Ignore — fall through to default
  }
  return 'Threads';
}

function subscribeToPerspective(set: (s: Partial<ThreadStoreState>) => void) {
  if (!isMailspringAvailable()) return;

  const perspectiveStore = getFocusedPerspectiveStore();

  function onPerspectiveChanged() {
    try {
      const perspective = perspectiveStore.current();
      const name = getPerspectiveName(perspective);

      // Tear down old subscription
      teardown();

      // Get the new thread query subscription from the perspective
      const newSub = perspective.threads();
      if (!newSub) {
        set({ threads: [], loading: false, perspectiveName: name });
        return;
      }

      _subscription = newSub;

      // The perspective creates queries with .limit(0) meaning "unlimited", but
      // QuerySubscription passes this literally to SQL as LIMIT 0 (= zero rows).
      // The old UI works because ObservableListDataSource replaces the query with
      // paged versions before it runs. We fix this by removing the limit and
      // forcing a re-fetch, since the constructor already ran with LIMIT 0.
      try {
        const query = newSub._query ?? newSub.query?.();
        if (query && query._range && query._range.limit === 0) {
          query._range.limit = null;
          query._range.offset = null;
          // Force re-fetch — the constructor already ran update() with LIMIT 0
          if (typeof newSub.update === 'function') {
            newSub.update();
          }
        }
      } catch {
        // If we can't access internals, proceed anyway
      }

      set({ loading: true, perspectiveName: name });

      _subscriptionCallback = (resultSet: any) => {
        try {
          let threads: Thread[];
          if (resultSet && typeof resultSet.models === 'function') {
            threads = resultSet.models().filter(Boolean);
          } else if (Array.isArray(resultSet)) {
            threads = resultSet;
          } else {
            threads = [];
          }
          set({ threads, loading: false });
        } catch (err) {
          console.error('[ThreadStore] Error in subscription callback:', err);
          set({ threads: [], loading: false });
        }
      };

      _subscription.addCallback(_subscriptionCallback);
    } catch (err) {
      console.error('[ThreadStore] Error in onPerspectiveChanged:', err);
      set({ threads: [], loading: false });
    }
  }

  // Listen to perspective changes
  _perspectiveUnlisten = perspectiveStore.listen(onPerspectiveChanged);

  // Also listen to DatabaseStore for change records that should update the subscription.
  // The QuerySubscriptionPool normally does this for subscriptions it manages,
  // but our subscription is created directly by the perspective and isn't pooled.
  try {
    const dbStore = getDatabaseStore();
    _dbUnlisten = dbStore.listen((change: any) => {
      if (_subscription && change && typeof _subscription.applyChangeRecord === 'function') {
        _subscription.applyChangeRecord(change);
      }
    });
  } catch (err) {
    console.warn('[ThreadStore] Could not subscribe to DatabaseStore:', err);
  }

  // Initialize with current perspective
  onPerspectiveChanged();
}

export const useThreadStore = create<ThreadStoreState>((set) => {
  if (isMailspringAvailable()) {
    // Defer subscription to next tick to ensure stores are fully initialized
    setTimeout(() => {
      try {
        subscribeToPerspective(set);
      } catch (err) {
        console.error('[ThreadStore] Failed to subscribe:', err);
        set({ threads: [], loading: false });
      }
    }, 0);
    return { threads: [], loading: true, perspectiveName: 'Inbox' };
  }

  // Dev mode: use mock data
  return { threads: MOCK_THREADS, loading: false, perspectiveName: 'Inbox' };
});
