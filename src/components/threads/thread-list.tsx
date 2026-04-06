import { Star, Paperclip } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useFocusStore } from '@/stores/focus-store';
import type { Thread } from '@/types/models';
import { cn } from '@/lib/utils';

// Mock data for development - will be replaced by real data from DatabaseStore
const MOCK_THREADS: Thread[] = [
  {
    id: '1',
    accountId: 'acc1',
    subject: 'Welcome to the new Mailspring',
    snippet: 'We are excited to announce the complete redesign of Mailspring with a modern stack...',
    unread: true,
    starred: true,
    version: 1,
    folders: [],
    labels: [],
    participants: [{ id: 'c1', accountId: 'acc1', name: 'Mailspring Team', email: 'team@mailspring.com' }],
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
    snippet: 'Hi team, I have attached the Q2 planning document for your review. Please take a look...',
    unread: true,
    starred: false,
    version: 1,
    folders: [],
    labels: [],
    participants: [{ id: 'c2', accountId: 'acc1', name: 'Sarah Chen', email: 'sarah@example.com' }],
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
    snippet: 'Thanks for the feedback! I will incorporate the changes and share the updated mockups...',
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
    snippet: 'Please find attached the invoice for services rendered in March 2026. Payment is due...',
    unread: false,
    starred: false,
    version: 1,
    folders: [],
    labels: [],
    participants: [{ id: 'c5', accountId: 'acc1', name: 'Billing', email: 'billing@acme.com' }],
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
    snippet: "Hey! Are you still up for the hiking trip this weekend? The weather forecast looks great...",
    unread: false,
    starred: true,
    version: 1,
    folders: [],
    labels: [],
    participants: [{ id: 'c6', accountId: 'acc1', name: 'Emma Wilson', email: 'emma@example.com' }],
    attachmentCount: 0,
    firstMessageTimestamp: Date.now() - 259200000,
    lastMessageReceivedTimestamp: Date.now() - 259200000,
    lastMessageSentTimestamp: 0,
    inAllMail: true,
  },
];

function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: Thread;
  active: boolean;
  onClick: () => void;
}) {
  const senderName = thread.participants[0]?.name ?? thread.participants[0]?.email ?? 'Unknown';

  return (
    <button
      onClick={onClick}
      className={cn(
        'no-select flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors',
        active ? 'bg-accent' : 'hover:bg-accent/50',
        thread.unread && 'font-medium'
      )}
    >
      <div className="flex items-center gap-2">
        {/* Unread dot */}
        <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', thread.unread ? 'bg-blue-500' : 'bg-transparent')} />

        {/* Sender */}
        <span className={cn('flex-1 truncate text-sm', thread.unread ? 'text-foreground' : 'text-foreground/80')}>
          {senderName}
        </span>

        {/* Meta */}
        <div className="flex items-center gap-1.5 shrink-0">
          {thread.attachmentCount > 0 && <Paperclip className="h-3 w-3 text-muted-foreground" />}
          {thread.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatRelativeDate(thread.lastMessageReceivedTimestamp)}
          </span>
        </div>
      </div>

      {/* Subject */}
      <span className={cn('truncate text-sm pl-3.5', thread.unread ? 'text-foreground' : 'text-foreground/70')}>
        {thread.subject}
      </span>

      {/* Snippet */}
      <span className="truncate text-xs text-muted-foreground pl-3.5">{thread.snippet}</span>
    </button>
  );
}

export function ThreadList() {
  const { focusedThread, setFocusedThread } = useFocusStore();

  return (
    <div className="flex h-full flex-col">
      {/* List header */}
      <div className="no-select flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-medium text-foreground">Inbox</h2>
        <span className="text-xs text-muted-foreground">{MOCK_THREADS.length} threads</span>
      </div>

      {/* Thread items */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-1">
          {MOCK_THREADS.map((thread) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              active={focusedThread?.id === thread.id}
              onClick={() => setFocusedThread(thread)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
