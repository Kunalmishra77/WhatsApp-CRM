import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen text-foreground overflow-hidden selection:bg-teal-500/20 selection:text-teal-600 dark:selection:text-teal-400 relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Ambient background blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-[540px] h-[540px] bg-teal-500/[0.09] blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[440px] h-[440px] bg-emerald-400/[0.07] blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Topbar />

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth flex flex-col">
          <main className="p-8 flex-1 w-full max-w-[1920px] mx-auto">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
