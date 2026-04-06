import { Star, Paperclip, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useFocusStore } from '@/stores/focus-store';
import { useThreadStore } from '@/stores/thread-store';
import type { Thread } from '@/types/models';
import { cn } from '@/lib/utils';
import { isMailspringAvailable, getActions, getTaskFactory } from '@/lib/mailspring-exports';

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
        'no-select flex w-full min-w-0 flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors',
        active ? 'bg-accent' : 'hover:bg-accent/50',
        thread.unread && 'font-medium'
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {/* Unread dot */}
        <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', thread.unread ? 'bg-blue-500' : 'bg-transparent')} />

        {/* Sender */}
        <span className={cn('min-w-0 flex-1 truncate text-sm', thread.unread ? 'text-foreground' : 'text-foreground/80')}>
          {senderName}
        </span>

        {/* Meta */}
        <div className="flex items-center gap-1.5 shrink-0">
          {thread.attachmentCount > 0 && <Paperclip className="h-3 w-3 text-muted-foreground" />}
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isMailspringAvailable()) return;
              try {
                const task = getTaskFactory().taskForInvertingStarred({
                  threads: [thread],
                  source: 'ThreadList',
                });
                getActions().queueTask(task);
              } catch (err) {
                console.warn('Star toggle failed:', err);
              }
            }}
            className="inline-flex items-center justify-center"
          >
            <Star
              className={cn(
                'h-3 w-3',
                thread.starred
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-transparent hover:text-muted-foreground'
              )}
            />
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatRelativeDate(thread.lastMessageReceivedTimestamp)}
          </span>
        </div>
      </div>

      {/* Subject */}
      <span className={cn('min-w-0 truncate text-sm pl-3.5', thread.unread ? 'text-foreground' : 'text-foreground/70')}>
        {thread.subject}
      </span>

      {/* Snippet */}
      <span className="min-w-0 truncate text-xs text-muted-foreground pl-3.5">{thread.snippet}</span>
    </button>
  );
}

export function ThreadList() {
  const { focusedThread, setFocusedThread } = useFocusStore();
  const { threads, loading, perspectiveName } = useThreadStore();

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* List header */}
      <div className="no-select flex h-[49px] items-center justify-between border-b border-border px-3">
        <h2 className="text-sm font-medium text-foreground">{perspectiveName}</h2>
        <span className="text-xs text-muted-foreground">
          {loading ? '' : `${threads.length} threads`}
        </span>
      </div>

      {/* Thread items */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No threads</p>
          </div>
        ) : (
          <div className="space-y-0.5 overflow-hidden p-1">
            {threads.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                active={focusedThread?.id === thread.id}
                onClick={() => setFocusedThread(thread)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
