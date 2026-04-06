import React, { createContext, useContext, useEffect, useState } from 'react';
import { isMailspringAvailable } from './mailspring-exports';

interface MailspringContextValue {
  ready: boolean;
}

const MailspringContext = createContext<MailspringContextValue>({ ready: false });

export function useMailspring() {
  return useContext(MailspringContext);
}

/**
 * Provider that gates the app on the Mailspring bridge being available.
 * When running inside Electron with the full bootstrap, this will be ready
 * immediately. When running standalone (Vite dev server), it will show
 * a loading state and use mock data.
 */
export function MailspringProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(isMailspringAvailable());

  useEffect(() => {
    if (ready) return;

    // When running in Vite dev server without Electron, mark as ready
    // immediately — stores will use mock data
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, [ready]);

  return <MailspringContext.Provider value={{ ready }}>{children}</MailspringContext.Provider>;
}
