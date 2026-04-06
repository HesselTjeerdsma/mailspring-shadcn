import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  isMailspringAvailable,
  getActions,
  getDraftStore,
  getDraftFactory,
  getTaskQueue,
  getContact,
} from '@/lib/mailspring-exports';
import type { Contact, Message } from '@/types/models';

type ComposeMode = 'reply' | 'reply-all' | 'forward';

interface InlineComposerProps {
  thread: any;
  message: Message | undefined;
  mode: ComposeMode;
  onClose: () => void;
}

function formatContacts(contacts: Contact[]): string {
  return contacts.map((c) => (c.name ? `${c.name} <${c.email}>` : c.email)).join(', ');
}

function parseContacts(input: string): any[] {
  if (!input.trim()) return [];
  const ContactClass = getContact();
  return input.split(',').map((s) => {
    const match = s.trim().match(/^(.+?)\s*<(.+?)>$/);
    if (match) return new ContactClass({ name: match[1].trim(), email: match[2].trim() });
    return new ContactClass({ name: '', email: s.trim() });
  });
}

export function InlineComposer({ thread, message, mode, onClose }: InlineComposerProps) {
  const [headerMessageId, setHeaderMessageId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Create the draft via the bridge
  useEffect(() => {
    if (!isMailspringAvailable() || !message) {
      setInitializing(false);
      return;
    }

    let cancelled = false;

    async function createDraft() {
      try {
        const draftStore = getDraftStore();
        const draftFactory = getDraftFactory();
        const Actions = getActions();
        const taskQueue = getTaskQueue();

        let draft: any;
        if (mode === 'forward') {
          draft = await draftFactory.createDraftForForward({ message, thread });
        } else {
          draft = await draftFactory.createOrUpdateDraftForReply({
            message,
            thread,
            type: mode,
            behavior: 'prefer-existing',
          });
        }

        if (cancelled) return;

        // Persist the draft
        const SyncbackDraftTask = (window as any).$m.SyncbackDraftTask;
        const task = new SyncbackDraftTask({ draft });
        Actions.queueTask(task);
        await taskQueue.waitForPerformLocal(task);

        if (cancelled) return;

        // Get the editing session
        const sess = await draftStore.sessionForClientId(draft.headerMessageId);
        const d = sess.draft();

        if (cancelled) {
          sess.changes.commit();
          return;
        }

        setSession(sess);
        setHeaderMessageId(draft.headerMessageId);
        setTo(formatContacts(d.to ?? []));
        setCc(formatContacts(d.cc ?? []));
        setBcc(formatContacts(d.bcc ?? []));
        setSubject(d.subject ?? '');
        setBody('');
        setShowCcBcc((d.cc?.length > 0) || (d.bcc?.length > 0));
        setInitializing(false);

        // Focus the body field
        setTimeout(() => bodyRef.current?.focus(), 100);
      } catch (e) {
        console.error('Failed to create draft:', e);
        setInitializing(false);
      }
    }

    createDraft();
    return () => {
      cancelled = true;
    };
  }, [thread?.id, message?.id, mode]);

  // Sync changes back to the session when fields change
  const syncToSession = useCallback(() => {
    if (!session) return;
    session.changes.add({
      to: parseContacts(to),
      cc: parseContacts(cc),
      bcc: parseContacts(bcc),
      subject,
      body: body || '',
    });
  }, [session, to, cc, bcc, subject, body]);

  const handleSend = useCallback(async () => {
    if (!session || !headerMessageId || sending) return;
    setSending(true);
    try {
      syncToSession();
      await session.changes.commit();
      getActions().sendDraft(headerMessageId, { delay: 0 });
      onClose();
    } catch (e) {
      console.error('Failed to send:', e);
      setSending(false);
    }
  }, [session, headerMessageId, sending, syncToSession, onClose]);

  const handleDiscard = useCallback(() => {
    if (!session || !headerMessageId) {
      onClose();
      return;
    }
    const d = session.draft();
    getActions().destroyDraft({
      accountId: d.accountId,
      headerMessageId: d.headerMessageId,
      id: d.id,
    });
    onClose();
  }, [session, headerMessageId, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDiscard();
      }
    },
    [handleSend, handleDiscard]
  );

  const modeLabel = mode === 'reply' ? 'Reply' : mode === 'reply-all' ? 'Reply All' : 'Forward';

  if (initializing) {
    return (
      <div className="rounded-lg border border-border bg-background shadow-sm p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing {modeLabel.toLowerCase()}...
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-primary/30 bg-background shadow-md"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {modeLabel}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDiscard}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Recipient fields */}
      <div className="px-4 py-2 space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <label className="w-10 shrink-0 text-xs text-muted-foreground text-right">To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            onBlur={syncToSession}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
            placeholder="Recipients..."
          />
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowCcBcc(!showCcBcc)}
          >
            {showCcBcc ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showCcBcc && (
          <>
            <div className="flex items-center gap-2">
              <label className="w-10 shrink-0 text-xs text-muted-foreground text-right">Cc</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                onBlur={syncToSession}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
                placeholder="Cc..."
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-10 shrink-0 text-xs text-muted-foreground text-right">Bcc</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                onBlur={syncToSession}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
                placeholder="Bcc..."
              />
            </div>
          </>
        )}

        {mode === 'forward' && (
          <div className="flex items-center gap-2">
            <label className="w-10 shrink-0 text-xs text-muted-foreground text-right">Subj</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={syncToSession}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Body */}
      <div className="px-4 py-3">
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={syncToSession}
          className="w-full min-h-[120px] resize-none bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed"
          placeholder="Write your message..."
        />
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send
          </Button>
          <span className="text-[10px] text-muted-foreground ml-1.5">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDiscard} className="text-muted-foreground">
          Discard
        </Button>
      </div>
    </div>
  );
}
