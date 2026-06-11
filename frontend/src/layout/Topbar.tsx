import React, { useState } from 'react';
import { 
  Bell, 
  Search as SearchIcon,
  Sun, 
  Moon, 
  ChevronDown,
  Calendar,
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../state/themeStore';
import { CustomDropdownMenu, DropdownMenuItem } from '../ui/CustomDropdownMenu';

export const Topbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    toast.info(`Searching for: ${searchQuery}`);
    setSearchQuery('');
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-[40] bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-b border-black/5 dark:border-white/10">
      {/* Search Bar Functionality */}
      <div className="flex-1 max-w-xl">
        <form onSubmit={handleSearch} className="relative group">
          <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-teal-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search patients, phone or signals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-2.5 pl-12 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-zinc-400"
          />
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 relative">
            <Bell size={18} />
            <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black shadow-sm" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-black/5 dark:bg-white/10 mx-2" />

        {/* Improved Profile Section */}
        <CustomDropdownMenu
          trigger={
            <div className="flex items-center gap-3 p-1 rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
               <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-105 transition-transform duration-300">
                  AS
               </div>
               <div className="hidden md:flex flex-col items-start pr-2">
                  <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">Amit Sharma</span>
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Super Agent</span>
               </div>
               <ChevronDown size={12} className="text-zinc-400 mr-1" />
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
          <DropdownMenuItem onClick={() => toast.error("Sign out simulated.")} icon={<LogOut size={14} />} className="text-red-500">
            Sign Out
          </DropdownMenuItem>
        </CustomDropdownMenu>
      </div>
    </header>
  );
};
