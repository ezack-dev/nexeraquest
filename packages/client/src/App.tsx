import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { MiniAppView } from './components/MiniApp/MiniAppView.js';
import { ProjectPortalView } from './components/ProjectPortal/ProjectPortalView.js';
import { AdminConsoleView } from './components/AdminConsole/AdminConsoleView.js';
import { MonitorView } from './components/MonitorView.js';

export const App: React.FC = () => {
  const [surface, setSurface] = useState<'miniapp' | 'portal' | 'admin'>('miniapp');
  const [standaloneMonitor, setStandaloneMonitor] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.pathname === '/monitor';
  });

  useEffect(() => {
    const onPopState = () => {
      setStandaloneMonitor(window.location.pathname === '/monitor');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleSetSurface = (next: 'miniapp' | 'portal' | 'admin') => {
    setStandaloneMonitor(false);
    setSurface(next);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0A0B0E] text-zinc-100 flex flex-col font-sans">
        <Navbar currentSurface={standaloneMonitor ? 'admin' : surface} setSurface={handleSetSurface} />
        <main className="flex-1">
          {standaloneMonitor ? (
            <MonitorView onBackToApp={() => handleSetSurface('miniapp')} />
          ) : (
            <>
              {surface === 'miniapp' && <MiniAppView />}
              {surface === 'portal' && <ProjectPortalView />}
              {surface === 'admin' && <AdminConsoleView />}
            </>
          )}
        </main>
      </div>
    </AuthProvider>
  );
};
