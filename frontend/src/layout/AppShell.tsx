import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

export const AppShell: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black overflow-hidden selection:bg-teal-500/20 selection:text-teal-600 dark:selection:text-teal-400">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar scroll-smooth">
        <Topbar />
        <main className="p-10 flex-1 relative z-10 w-full max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Outlet />
        </main>
        <Footer />
        
        {/* Background Gradients */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[150px] -z-10 rounded-full opacity-50 dark:opacity-30 pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/10 blur-[120px] -z-10 rounded-full opacity-50 dark:opacity-20 pointer-events-none -translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
};
