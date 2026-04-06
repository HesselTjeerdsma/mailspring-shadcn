import { Group, Panel, Separator as ResizeHandle, useDefaultLayout } from 'react-resizable-panels';
import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { ThreadList } from '../threads/thread-list';
import { MessageDetail } from '../messages/message-detail';
import { useUIStore } from '@/stores/ui-store';

function ResizeBar() {
  return (
    <ResizeHandle className="group relative w-px bg-border hover:bg-ring/50 active:bg-ring/50">
      <div className="absolute inset-y-0 -left-1.5 w-3 cursor-col-resize group-hover:bg-ring/20 group-active:bg-ring/40 transition-colors" />
    </ResizeHandle>
  );
}

export function AppLayout() {
  const { sidebarCollapsed, layoutMode } = useUIStore();

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'mailspring-main',
    storage: localStorage,
  });

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Toolbar />
      <Group
        orientation="horizontal"
        className="flex-1 overflow-hidden"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <>
            <Panel
              id="sidebar"
              defaultSize={18}
              minSize="180px"
              maxSize="320px"
              className="flex flex-col overflow-hidden"
            >
              <Sidebar />
            </Panel>
            <ResizeBar />
          </>
        )}

        {/* Thread List */}
        <Panel
          id="thread-list"
          defaultSize={32}
          minSize="240px"
          className="flex flex-col overflow-hidden"
        >
          <ThreadList />
        </Panel>

        {layoutMode !== 'list' && (
          <>
            <ResizeBar />

            {/* Message Detail */}
            <Panel
              id="message-detail"
              defaultSize={50}
              minSize="300px"
              className="flex flex-col overflow-hidden"
            >
              <MessageDetail />
            </Panel>
          </>
        )}
      </Group>
    </div>
  );
}
