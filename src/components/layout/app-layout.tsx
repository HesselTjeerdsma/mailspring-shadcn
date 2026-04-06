import { Group, Panel, Separator as ResizeHandle } from 'react-resizable-panels';
import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { ThreadList } from '../threads/thread-list';
import { MessageDetail } from '../messages/message-detail';
import { useUIStore } from '@/stores/ui-store';

export function AppLayout() {
  const { sidebarCollapsed, layoutMode } = useUIStore();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Group direction="horizontal">
          {/* Sidebar */}
          {!sidebarCollapsed && (
            <>
              <Panel
                id="sidebar"
                order={1}
                defaultSize={18}
                minSize={14}
                maxSize={28}
                className="flex flex-col min-w-[180px]"
              >
                <Sidebar />
              </Panel>
              <ResizeHandle className="w-px bg-border hover:bg-ring transition-colors" />
            </>
          )}

          {/* Thread List */}
          <Panel
            id="thread-list"
            order={2}
            defaultSize={32}
            minSize={22}
            maxSize={50}
            className="flex flex-col min-w-[280px]"
          >
            <ThreadList />
          </Panel>

          {layoutMode !== 'list' && (
            <>
              <ResizeHandle className="w-px bg-border hover:bg-ring transition-colors" />

              {/* Message Detail */}
              <Panel
                id="message-detail"
                order={3}
                defaultSize={50}
                minSize={30}
                className="flex flex-col"
              >
                <MessageDetail />
              </Panel>
            </>
          )}
        </Group>
      </div>
    </div>
  );
}
