import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { MiniAppView } from './components/MiniApp/MiniAppView.js';
import { ProjectPortalView } from './components/ProjectPortal/ProjectPortalView.js';
import { AdminConsoleView } from './components/AdminConsole/AdminConsoleView.js';

export const App: React.FC = () => {
  const [surface, setSurface] = useState<'miniapp' | 'portal' | 'admin'>('miniapp');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans">
        <Navbar currentSurface={surface} setSurface={setSurface} />
        <main className="flex-1">
          {surface === 'miniapp' && <MiniAppView />}
          {surface === 'portal' && <ProjectPortalView />}
          {surface === 'admin' && <AdminConsoleView />}
        </main>
      </div>
    </AuthProvider>
  );
};
