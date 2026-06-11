import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Inbox,
  BarChart3,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  ListTodo,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { dataApi } from '../data/api';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/conversations', label: 'Conversations', icon: MessageSquare },
  { path: '/live-inbox', label: 'Live Inbox', icon: Inbox, liveCount: true },
  { path: '/lead-insights', label: 'Lead Insights', icon: Zap },
  { path: '/tasks', label: 'Tasks & Follow-ups', icon: ListTodo },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/exports', label: 'Exports', icon: Download },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: liveCount } = useQuery({
    queryKey: ['sidebar-live-count', today],
    queryFn: () => dataApi.fetchSessions({ from: sevenDaysAgo, to: today }),
    refetchInterval: 60000,
    select: (data: any[]) => (data?.length ?? 0),
  });

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {collapsed ? (
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
              U
            </div>
          ) : (
            <img
              src="https://umang2-0.vercel.app/Umang-logo.webp"
              alt="Umang Superspeciality Hospital"
              className="h-10 w-auto object-contain"
            />
          )}
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 py-2">
        {NAV_ITEMS.map((item) => {
          const count = item.liveCount && liveCount ? liveCount : 0;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold"
                  : "text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-500 rounded-full" />
                  )}
                  <item.icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "shrink-0 ml-1",
                      isActive ? "text-teal-600 dark:text-teal-400" : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors"
                    )}
                  />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="text-sm tracking-tight truncate">{item.label}</span>
                      {count > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-teal-500 text-white rounded-full min-w-[18px] text-center">
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle — desktop only */}
      <div className="hidden lg:block p-4 border-t border-black/5 dark:border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 text-xs font-semibold"
        >
          {collapsed
            ? <ChevronRight size={18} />
            : <><ChevronLeft size={18} /><span className="uppercase tracking-widest text-[10px]">Collapse</span></>
          }
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen flex-col transition-all duration-300 bg-white dark:bg-[#111] border-r border-black/5 dark:border-white/10 sticky top-0 z-[50] shrink-0",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-72 flex flex-col bg-white dark:bg-[#111] border-r border-black/5 dark:border-white/10 z-[70] transition-transform duration-300 shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
};
