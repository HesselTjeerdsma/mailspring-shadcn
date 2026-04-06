import { AppLayout } from './components/layout/app-layout';
import { MailspringProvider } from './lib/mailspring-provider';
import { TooltipProvider } from './components/ui/tooltip';

export function App() {
  return (
    <MailspringProvider>
      <TooltipProvider delayDuration={300}>
        <AppLayout />
      </TooltipProvider>
    </MailspringProvider>
  );
}
