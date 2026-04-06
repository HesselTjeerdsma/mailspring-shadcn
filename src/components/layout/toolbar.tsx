import {
  Archive,
  Trash2,
  Mail,
  MailOpen,
  Star,
  Tag,
  FolderInput,
  Search,
  Settings,
  PanelLeft,
  RotateCcw,
  PenSquare,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useUIStore } from '@/stores/ui-store';
import { useFocusStore } from '@/stores/focus-store';
import { cn } from '@/lib/utils';

export function Toolbar() {
  const { toggleSidebar, setCommandPaletteOpen, setComposeOpen } = useUIStore();
  const { focusedThread } = useFocusStore();

  return (
    <div className="no-select flex h-12 items-center gap-1 border-b border-border bg-background px-2">
      {/* Sidebar toggle */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
        <PanelLeft className="h-4 w-4" />
      </Button>

      {/* Compose */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setComposeOpen(true)}
        className="gap-1.5"
      >
        <PenSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Compose</span>
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Thread actions — only active when a thread is focused */}
      <div className={cn('flex items-center gap-0.5', !focusedThread && 'opacity-40 pointer-events-none')}>
        <Button variant="ghost" size="icon" title="Archive (E)">
          <Archive className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Trash (#)">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Mark as read/unread">
          <MailOpen className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Star (S)">
          <Star className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Label (L)">
          <Tag className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Move to folder (V)">
          <FolderInput className="h-4 w-4" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCommandPaletteOpen(true)}
        className="gap-1.5 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          /
        </kbd>
      </Button>
    </div>
  );
}
