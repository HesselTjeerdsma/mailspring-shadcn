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
  Minus,
  Square,
  X,
} from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '../ui/button';
import { useUIStore } from '@/stores/ui-store';
import { useFocusStore } from '@/stores/focus-store';
import { cn } from '@/lib/utils';

const isMacPlatform =
  typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

function WindowControls() {
  const isElectron = typeof window !== 'undefined' && !!(window as any).AppEnv;

  const handleClose = useCallback(() => {
    (window as any).AppEnv?.close();
  }, []);

  const handleMinimize = useCallback(() => {
    (window as any).AppEnv?.minimize();
  }, []);

  const handleMaximize = useCallback(() => {
    const appEnv = (window as any).AppEnv;
    if (!appEnv) return;
    if (isMacPlatform) {
      appEnv.setFullScreen(!appEnv.isFullScreen());
    } else {
      appEnv.maximize();
    }
  }, []);

  if (!isElectron) return null;

  // On macOS, show native-style traffic lights on the left
  if (isMacPlatform) {
    return (
      <div className="window-controls-mac flex items-center gap-2 pl-1.5 pr-1 app-no-drag">
        <button
          onClick={handleClose}
          className="h-3 w-3 rounded-full bg-[#ff5f57] hover:brightness-90 active:brightness-75"
          aria-label="Close window"
        />
        <button
          onClick={handleMinimize}
          className="h-3 w-3 rounded-full bg-[#febc2e] hover:brightness-90 active:brightness-75"
          aria-label="Minimize window"
        />
        <button
          onClick={handleMaximize}
          className="h-3 w-3 rounded-full bg-[#28c840] hover:brightness-90 active:brightness-75"
          aria-label="Maximize window"
        />
      </div>
    );
  }

  // On Linux (frameless/hamburger mode), show icon-based controls on the right
  return (
    <div className="window-controls-linux flex items-center app-no-drag">
      <Button variant="ghost" size="icon" onClick={handleMinimize} className="h-8 w-8 rounded-none" aria-label="Minimize window">
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleMaximize} className="h-8 w-8 rounded-none" aria-label="Maximize window">
        <Square className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-none hover:bg-destructive hover:text-destructive-foreground" aria-label="Close window">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function Toolbar() {
  const { toggleSidebar, setCommandPaletteOpen, setComposeOpen } = useUIStore();
  const { focusedThread } = useFocusStore();

  const isMac = isMacPlatform;

  return (
    <div className="no-select app-drag flex h-12 items-center gap-1 border-b border-border bg-background px-2">
      {/* macOS: window controls on the left */}
      {isMac && <WindowControls />}

      {/* Sidebar toggle */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0 app-no-drag">
        <PanelLeft className="h-4 w-4" />
      </Button>

      {/* Compose */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setComposeOpen(true)}
        className="gap-1.5 app-no-drag"
      >
        <PenSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Compose</span>
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Thread actions — only active when a thread is focused */}
      <div className={cn('flex items-center gap-0.5 app-no-drag', !focusedThread && 'opacity-40 pointer-events-none')}>
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
        className="gap-1.5 text-muted-foreground app-no-drag"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          /
        </kbd>
      </Button>

      {/* Linux: window controls on the right */}
      {!isMac && <WindowControls />}
    </div>
  );
}
