import {
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Paperclip,
  ExternalLink,
  Archive,
  Trash2,
  MailOpen,
  Star,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useFocusStore } from '@/stores/focus-store';
import {
  isMailspringAvailable,
  getActions,
  getTaskFactory,
} from '@/lib/mailspring-exports';

function bridgeAction(fn: () => void) {
  if (!isMailspringAvailable()) return;
  try {
    fn();
  } catch (e) {
    console.warn('Bridge action failed:', e);
  }
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center bg-muted/30">
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

  const handleReply = () =>
    bridgeAction(() => getActions().composeReply({ threadId: focusedThread.id, type: 'reply' }));

  const handleReplyAll = () =>
    bridgeAction(() =>
      getActions().composeReply({ threadId: focusedThread.id, type: 'reply-all' })
    );

  const handleForward = () =>
    bridgeAction(() => getActions().composeForward({ threadId: focusedThread.id }));

  const handlePopout = () =>
    bridgeAction(() => getActions().popoutThread(focusedThread));

  const handleArchive = () =>
    bridgeAction(() => {
      const tasks = getTaskFactory().tasksForArchiving({
        threads: [focusedThread],
        source: 'Toolbar',
      });
      for (const task of tasks) {
        getActions().queueTask(task);
      }
    });

  const handleTrash = () =>
    bridgeAction(() => {
      const tasks = getTaskFactory().tasksForMovingToTrash({
        threads: [focusedThread],
        source: 'Toolbar',
      });
      for (const task of tasks) {
        getActions().queueTask(task);
      }
    });

  const handleToggleUnread = () =>
    bridgeAction(() => {
      const task = getTaskFactory().taskForInvertingUnread({
        threads: [focusedThread],
        source: 'Toolbar',
      });
      getActions().queueTask(task);
    });

  const handleToggleStar = () =>
    bridgeAction(() => {
      const task = getTaskFactory().taskForInvertingStarred({
        threads: [focusedThread],
        source: 'Toolbar',
      });
      getActions().queueTask(task);
    });

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Thread header */}
      <div className="no-select border-b border-border bg-background px-5 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">{focusedThread.subject}</h1>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Toggle star" onClick={handleToggleStar}>
              <Star className={`h-3.5 w-3.5 ${focusedThread.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark unread" onClick={handleToggleUnread}>
              <MailOpen className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Archive" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Move to trash" onClick={handleTrash}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Open in new window" onClick={handlePopout}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {focusedThread.attachmentCount > 0 && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {focusedThread.attachmentCount} attachment{focusedThread.attachmentCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Message content */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 max-w-3xl">
          {/* Single message (mock — in real app this iterates over thread.messages()) */}
          <div className="rounded-lg border border-border bg-background shadow-sm">
            {/* Message header */}
            <div className="flex items-start justify-between px-5 pt-4 pb-0">
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
                <span className="text-xs text-muted-foreground whitespace-nowrap">
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
            <div className="px-5 pb-5 text-sm leading-relaxed text-foreground">
              <p>{focusedThread.snippet}</p>
              <p className="text-muted-foreground italic mt-4">
                Full message body will be rendered here when connected to the database.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Reply bar */}
      <div className="no-select border-t border-border bg-background px-5 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleReply}>
            <Reply className="h-4 w-4" />
            Reply
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleReplyAll}>
            <ReplyAll className="h-4 w-4" />
            Reply All
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleForward}>
            <Forward className="h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}
