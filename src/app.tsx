import { AppLayout } from './components/layout/app-layout';
import { MailspringProvider } from './lib/mailspring-provider';

export function App() {
  return (
    <MailspringProvider>
      <AppLayout />
    </MailspringProvider>
  );
}
