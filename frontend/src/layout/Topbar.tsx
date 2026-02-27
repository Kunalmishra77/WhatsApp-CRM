import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search as SearchIcon,
  Sun, 
  Moon, 
  User, 
  ChevronDown,
  Activity
} from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

export const Topbar: React.FC = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleComingSoon = () => {
    toast.info("Coming next: This feature is being synthesized.");
  };

  return (
    <header className="h-24 px-8 flex items-center justify-between sticky top-0 z-[40] glass-morphism border-b border-zinc-200/50 dark:border-white/5 shadow-premium">
      {/* Search bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-teal-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Leads / Phone..."
            className="w-full bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-500/20 transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-600"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 uppercase tracking-widest pointer-events-none px-2 py-1 rounded-md bg-zinc-200/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">Cmd + K</div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] shadow-[0_0_12px_rgba(20,184,166,0.2)]">
           <Activity size={12} className="animate-pulse" /> Signal Active
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleComingSoon} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 relative">
            <Bell size={20} />
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </Button>
          
          <div className="w-px h-8 bg-zinc-200 dark:bg-white/10" />

          <div 
            onClick={handleComingSoon}
            className="flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-white/5 p-1.5 pr-4 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-white/5 group"
          >
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
                <User size={20} />
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight uppercase italic">Umang <span className="font-light text-zinc-500 text-xs">PRO</span></span>
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest leading-none flex items-center gap-1">Super Agent <ChevronDown size={10} /></span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};
