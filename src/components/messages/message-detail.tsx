import { Reply, ReplyAll, Forward, MoreHorizontal, Paperclip } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useFocusStore } from '@/stores/focus-store';
import { cn } from '@/lib/utils';

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">Select a conversation to read</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Use <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">j</kbd> /{' '}
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">k</kbd> to navigate
        </p>
      </div>
    </div>
  );
}

export function MessageDetail() {
  const { focusedThread } = useFocusStore();

  if (!focusedThread) {
    return <EmptyState />;
  }

  const sender = focusedThread.participants[0];
  const senderName = sender?.name ?? sender?.email ?? 'Unknown';
  const senderEmail = sender?.email ?? '';
  const date = new Date(focusedThread.lastMessageReceivedTimestamp);

  return (
    <div className="flex h-full flex-col">
      {/* Thread header */}
      <div className="no-select border-b border-border px-4 py-3">
        <h1 className="text-base font-semibold text-foreground">{focusedThread.subject}</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{focusedThread.participants.length} participants</span>
          <span>&middot;</span>
          <span>
            {focusedThread.attachmentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {focusedThread.attachmentCount} attachment{focusedThread.attachmentCount !== 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Message content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          {/* Single message (mock — in real app this iterates over thread.messages()) */}
          <div className="rounded-lg border border-border bg-card p-4">
            {/* Message header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {senderName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{senderName}</p>
                  <p className="text-xs text-muted-foreground">{senderEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Message body (mock) */}
            <div className="prose prose-sm max-w-none text-foreground">
              <p>{focusedThread.snippet}</p>
              <p className="text-muted-foreground italic mt-4">
                Full message body will be rendered here when connected to the database.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Reply bar */}
      <div className="no-select border-t border-border px-4 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Reply className="h-4 w-4" />
            Reply
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ReplyAll className="h-4 w-4" />
            Reply All
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Forward className="h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}
