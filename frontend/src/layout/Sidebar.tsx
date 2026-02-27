import React, { useState } from 'react';
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
  ListTodo
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from '../ui/Badge';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/conversations', label: 'Conversations', icon: MessageSquare },
  { path: '/live-inbox', label: 'Live Inbox', icon: Inbox, badge: '12' },
  { path: '/lead-insights', label: 'Lead Insights', icon: Zap },
  { path: '/tasks', label: 'Tasks & Follow-ups', icon: ListTodo },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/exports', label: 'Exports', icon: Download },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col transition-all duration-500 glass-morphism border-r border-zinc-200/50 dark:border-white/5 sticky top-0 z-[50]",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo */}
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)] shrink-0">
          <Zap size={22} fill="currentColor" strokeWidth={0} />
        </div>
        {!collapsed && (
          <h1 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase italic">
            India<span className="font-light text-zinc-500 text-sm">Grain</span>
          </h1>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
              isActive 
                ? "bg-teal-500/10 dark:bg-teal-500/5 text-teal-600 dark:text-teal-400 border border-teal-500/20 dark:border-teal-500/10 shadow-sm" 
                : "text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-teal-600 dark:text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.4)]" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors"
                  )}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    {item.badge && (
                      <Badge variant="teal" size="xs" className="rounded-full px-1.5 py-0 min-w-[18px] h-[18px]">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
                {isActive && (
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-teal-500 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.8)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-white/5">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
        >
          {collapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-3"><ChevronLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest">Collapse</span></div>}
        </button>
      </div>
    </aside>
  );
};
