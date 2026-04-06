import { useEffect, useState, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { InlineComposer } from '../composer/inline-composer';
import { useFocusStore } from '@/stores/focus-store';
import type { Message } from '@/types/models';
import {
  isMailspringAvailable,
  getActions,
  getTaskFactory,
  getMessageStore,
} from '@/lib/mailspring-exports';

type ComposeMode = 'reply' | 'reply-all' | 'forward';

function bridgeAction(fn: () => void) {
  if (!isMailspringAvailable()) return;
  try {
    fn();
  } catch (e) {
    console.warn('Bridge action failed:', e);
  }
}

function useMessages(): { messages: Message[]; loading: boolean } {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isMailspringAvailable()) return;

    const msgStore = getMessageStore();

    function onMessagesChanged() {
      const items = msgStore.items() ?? [];
      setMessages(items);
      setLoading(msgStore.itemsLoading());
    }

    const unlisten = msgStore.listen(onMessagesChanged);
    // Load initial state
    onMessagesChanged();

    return () => unlisten();
  }, []);

  return { messages, loading };
}

function MessageBody({ message }: { message: Message }) {
  const [processedBody, setProcessedBody] = useState<string | null>(null);

  useEffect(() => {
    if (!isMailspringAvailable() || !message.body) {
      setProcessedBody(null);
      return;
    }
    // Use the body directly — MessageBodyProcessor is an optimization
    // but the raw body works for display
    setProcessedBody(message.body);
  }, [message.id, message.body]);

  if (!processedBody) {
    return (
      <div className="px-5 pb-5 text-sm leading-relaxed text-foreground">
        <p>{message.snippet}</p>
      </div>
    );
  }

  return (
    <div
      className="px-5 pb-5 text-sm leading-relaxed text-foreground [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: processedBody }}
    />
  );
}

function MessageItem({ message, defaultExpanded }: { message: Message; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sender = message.from?.[0];
  const senderName = sender?.name ?? sender?.email ?? 'Unknown';
  const senderEmail = sender?.email ?? '';
  const date = new Date(message.date);

  return (
    <div className="rounded-lg border border-border bg-background shadow-sm">
      {/* Message header */}
      <button
        className="flex w-full items-start justify-between px-5 pt-4 pb-0 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
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
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </button>

      {expanded ? (
        <>
          <Separator className="my-3" />
          <MessageBody message={message} />
        </>
      ) : (
        <p className="px-5 pb-3 pt-1 text-xs text-muted-foreground truncate">
          {message.snippet}
        </p>
      )}
    </div>
  );
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
  const { messages, loading } = useMessages();
  const [composeMode, setComposeMode] = useState<ComposeMode | null>(null);

  // Filter messages to those belonging to the focused thread
  const threadMessages = focusedThread
    ? messages.filter((m) => m.threadId === focusedThread.id)
    : [];
  const hasRealMessages = isMailspringAvailable() && threadMessages.length > 0;

  // Close composer when thread changes
  useEffect(() => {
    setComposeMode(null);
  }, [focusedThread?.id]);

  if (!focusedThread) {
    return <EmptyState />;
  }

  const lastMessage = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : undefined;

  const handleReply = () => setComposeMode('reply');
  const handleReplyAll = () => setComposeMode('reply-all');
  const handleForward = () => setComposeMode('forward');

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
        <div className="px-5 py-4 max-w-3xl space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasRealMessages ? (
            threadMessages.map((message, i) => (
              <MessageItem
                key={message.id}
                message={message}
                defaultExpanded={i === threadMessages.length - 1}
              />
            ))
          ) : (
            /* Fallback: show snippet when no real messages available */
            <div className="rounded-lg border border-border bg-background shadow-sm">
              <div className="flex items-start justify-between px-5 pt-4 pb-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {(focusedThread.participants[0]?.name ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {focusedThread.participants[0]?.name ?? focusedThread.participants[0]?.email ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {focusedThread.participants[0]?.email ?? ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(focusedThread.lastMessageReceivedTimestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="px-5 pb-5 text-sm leading-relaxed text-foreground">
                <p>{focusedThread.snippet}</p>
              </div>
            </div>
          )}

          {/* Inline composer */}
          {composeMode && (
            <InlineComposer
              thread={focusedThread}
              message={lastMessage}
              mode={composeMode}
              onClose={() => setComposeMode(null)}
            />
          )}
        </div>
      </ScrollArea>

      {/* Reply bar — hidden when composer is open */}
      {!composeMode && (
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
      )}
    </div>
  );
}
