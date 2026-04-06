import {
  Inbox,
  Send,
  FileEdit,
  Star,
  Archive,
  Trash2,
  AlertCircle,
  Tag,
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  User,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useAccountStore } from '@/stores/account-store';
import { useMailboxStore } from '@/stores/mailbox-store';
import { cn } from '@/lib/utils';
import {
  isMailspringAvailable,
  getActions,
  getMailboxPerspective,
  getCategoryStore,
  getAccountStore,
  sendCommand,
} from '@/lib/mailspring-exports';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, count, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'no-select flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center text-sidebar-muted">{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count != null && count > 0 && (
        <span className="text-xs tabular-nums text-sidebar-muted">{count}</span>
      )}
    </button>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SidebarSection({ title, children, defaultOpen = true }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="no-select flex w-full items-center gap-1 px-2 py-1 text-xs font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && <div className="space-y-0.5 px-1">{children}</div>}
    </div>
  );
}

function focusPerspectiveByRole(role: string) {
  if (!isMailspringAvailable()) return;
  try {
    const Perspective = getMailboxPerspective();
    const catStore = getCategoryStore();
    const accountIds = getAccountStore().accountIds();

    if (role === 'starred') {
      const perspective = Perspective.forStarred(accountIds);
      getActions().focusMailboxPerspective(perspective);
      return;
    }

    if (role === 'drafts') {
      const perspective = Perspective.forDrafts(accountIds);
      getActions().focusMailboxPerspective(perspective);
      return;
    }

    // For category-based perspectives (inbox, sent, archive, spam, trash)
    const categories = accountIds
      .map((id: string) => catStore.getCategoryByRole(id, role))
      .filter(Boolean);

    if (categories.length > 0) {
      const perspective = Perspective.forCategories(categories);
      getActions().focusMailboxPerspective(perspective);
    }
  } catch (err) {
    console.warn('Failed to focus perspective:', role, err);
  }
}

function openAccountPreferences() {
  if (!isMailspringAvailable()) return;
  try {
    getActions().switchPreferencesTab('Accounts');
    getActions().openPreferences();
  } catch (err) {
    console.warn('Failed to open account preferences:', err);
  }
}

function addAccount() {
  sendCommand('application:add-account');
}

function openPreferences() {
  if (!isMailspringAvailable()) return;
  try {
    getActions().openPreferences();
  } catch (err) {
    console.warn('Failed to open preferences:', err);
  }
}

/** Returns 1-2 initials from an account name */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Sidebar() {
  const { accounts } = useAccountStore();
  const { selectedCategory, selectCategory } = useMailboxStore();
  const [activeItem, setActiveItem] = useState('inbox');

  const handleNavClick = useCallback((role: string) => {
    setActiveItem(role);
    focusPerspectiveByRole(role);
  }, []);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Account selector */}
      <div className="no-select flex h-[49px] items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {accounts.length > 0 ? accounts[0].name : 'Mailspring'}
          </p>
          <p className="truncate text-xs text-sidebar-muted">
            {accounts.length > 0 ? accounts[0].emailAddress : 'No accounts'}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={openPreferences}
              className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Preferences</TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <SidebarSection title="Mailboxes">
          <SidebarItem
            icon={<Inbox className="h-4 w-4" />}
            label="Inbox"
            active={activeItem === 'inbox'}
            onClick={() => handleNavClick('inbox')}
          />
          <SidebarItem
            icon={<Star className="h-4 w-4" />}
            label="Starred"
            active={activeItem === 'starred'}
            onClick={() => handleNavClick('starred')}
          />
          <SidebarItem
            icon={<Send className="h-4 w-4" />}
            label="Sent"
            active={activeItem === 'sent'}
            onClick={() => handleNavClick('sent')}
          />
          <SidebarItem
            icon={<FileEdit className="h-4 w-4" />}
            label="Drafts"
            active={activeItem === 'drafts'}
            onClick={() => handleNavClick('drafts')}
          />
          <SidebarItem
            icon={<Archive className="h-4 w-4" />}
            label="Archive"
            active={activeItem === 'archive'}
            onClick={() => handleNavClick('archive')}
          />
          <SidebarItem
            icon={<AlertCircle className="h-4 w-4" />}
            label="Spam"
            active={activeItem === 'spam'}
            onClick={() => handleNavClick('spam')}
          />
          <SidebarItem
            icon={<Trash2 className="h-4 w-4" />}
            label="Trash"
            active={activeItem === 'trash'}
            onClick={() => handleNavClick('trash')}
          />
        </SidebarSection>

        <SidebarSection title="Labels" defaultOpen={false}>
          <div className="px-2 py-2 text-xs text-sidebar-muted">
            Labels will appear here once connected to an account.
          </div>
        </SidebarSection>

        <SidebarSection title="Folders" defaultOpen={false}>
          <div className="px-2 py-2 text-xs text-sidebar-muted">
            Folders will appear here once connected to an account.
          </div>
        </SidebarSection>

        <SidebarSection title="Accounts">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={openAccountPreferences}
              className="no-select flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors group"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white shrink-0"
                style={{
                  backgroundColor: account.color || 'var(--color-primary)',
                }}
              >
                {getInitials(account.name)}
              </span>
              <span className="flex-1 truncate text-left">{account.emailAddress}</span>
              {account.syncState !== 'ok' && (
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              )}
              <Settings className="h-3.5 w-3.5 text-sidebar-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
          <button
            onClick={addAccount}
            className="no-select flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        </SidebarSection>
      </ScrollArea>
    </div>
  );
}
