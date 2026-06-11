import React, { useState } from 'react';
import {
  Search as SearchIcon,
  Sun,
  Moon,
  ChevronDown,
  Settings,
  LogOut,
  User as UserIcon,
  Menu
} from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../state/themeStore';
import { CustomDropdownMenu, DropdownMenuItem } from '../ui/CustomDropdownMenu';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3 sticky top-0 z-[40] bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-b border-black/5 dark:border-white/10">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg">
        <form onSubmit={handleSearch} className="relative group">
          <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
          <input
            type="text"
            placeholder="Search patients, phone or signals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/[0.04] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all placeholder:text-zinc-400 dark:text-zinc-200"
          />
        </form>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </Button>

        {/* Real notification bell */}
        <NotificationBell />

        <div className="w-px h-5 bg-black/8 dark:bg-white/10 mx-1" />

        {/* Profile */}
        <CustomDropdownMenu
          trigger={
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                AS
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 leading-none">Amit Sharma</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Super Agent</span>
              </div>
              <ChevronDown size={12} className="text-zinc-400 hidden sm:block" />
            </div>
          }
        >
          <DropdownMenuItem onClick={() => navigate('/settings')} icon={<UserIcon size={14} />}>
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')} icon={<Settings size={14} />}>
            System Settings
          </DropdownMenuItem>
          <div className="h-px bg-black/5 dark:bg-white/10 my-1" />
          <DropdownMenuItem
            onClick={() => toast.error('Sign out simulated.')}
            icon={<LogOut size={14} />}
            className="text-red-500"
          >
            Sign Out
          </DropdownMenuItem>
        </CustomDropdownMenu>
      </div>
    </header>
  );
};
