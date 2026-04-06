/**
 * TypeScript interfaces for the core Mailspring models.
 * These mirror the attributes defined in app/src/flux/models/ so the new UI
 * has proper typing without importing the old class-based models directly.
 */

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  email: string;
  thirdPartyData?: Record<string, unknown>;
  isSearchIndexed?: boolean;
  refs?: number;
}

export interface Account {
  id: string;
  name: string;
  provider: string;
  emailAddress: string;
  label?: string;
  aliases: string[];
  defaultAlias?: string;
  syncState: 'ok' | 'invalid' | 'sync_error';
  syncError?: { message?: string } | null;
  authedAt?: Date;
  color?: string;
  settings: Record<string, unknown>;
}

export interface Category {
  id: string;
  accountId: string;
  role: string | null;
  path: string;
  displayName: string;
  localStatus?: {
    syncedMinUID?: number;
    bodiesPresent?: number;
    bodiesWanted?: number;
    uidnext?: number;
    busy?: boolean;
  };
}

export interface Folder extends Category {
  _cls: 'Folder';
}

export interface Label extends Category {
  _cls: 'Label';
}

export interface File {
  id: string;
  accountId: string;
  filename: string;
  size: number;
  contentType: string;
  contentId?: string;
}

export interface Thread {
  id: string;
  accountId: string;
  subject: string;
  snippet: string;
  unread: boolean;
  starred: boolean;
  version: number;
  folders: Folder[];
  labels: Label[];
  participants: Contact[];
  attachmentCount: number;
  firstMessageTimestamp: number;
  lastMessageReceivedTimestamp: number;
  lastMessageSentTimestamp: number;
  inAllMail: boolean;
  // Methods from the model that we'll need
  sortedCategories?: () => Category[];
}

export interface Message {
  id: string;
  accountId: string;
  threadId: string;
  to: Contact[];
  cc: Contact[];
  bcc: Contact[];
  from: Contact[];
  replyTo: Contact[];
  subject: string;
  snippet: string;
  body?: string;
  date: Date;
  unread: boolean;
  starred: boolean;
  draft: boolean;
  pristine?: boolean;
  plaintext?: boolean;
  files: File[];
  version: number;
  headerMessageId: string;
  replyToHeaderMessageId?: string;
  forwardedHeaderMessageId?: string;
  folder?: Folder;
  listUnsubscribe?: string;
}
