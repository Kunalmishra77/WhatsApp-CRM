import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-teal-500/20 selection:text-teal-600 dark:selection:text-teal-400">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth flex flex-col">
          <main className="p-8 flex-1 w-full max-w-[1920px] mx-auto">
            <Outlet />
          </main>
          <Footer />
        </div>

        {/* Background Gradients */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[150px] -z-10 rounded-full opacity-30 dark:opacity-30 pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/10 blur-[120px] -z-10 rounded-full opacity-20 dark:opacity-20 pointer-events-none -translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
};
