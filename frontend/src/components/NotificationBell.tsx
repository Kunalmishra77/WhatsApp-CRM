import React, { useState, useRef, useEffect } from 'react';
import { Bell, Flame, ChevronRight, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dataApi } from '../data/api';
import { cn } from '../lib/utils';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const { data: hotLeads = [] } = useQuery({
    queryKey: ['notif-hot-leads', today],
    queryFn: () => dataApi.fetchLeads({ range: { from: today, to: today }, bucket: 'Hot' }),
    refetchInterval: 60_000,
    select: (leads) => leads.slice(0, 8),
  });

  const count = hotLeads.length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-xl transition-colors",
          open
            ? "bg-teal-500/10 text-teal-600"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5"
        )}
      >
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1c1c1e] border border-black/8 dark:border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Hot Leads Today</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {count > 0 ? `${count} lead${count > 1 ? 's' : ''} need attention` : 'No hot leads today'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400">
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {count === 0 ? (
              <div className="py-8 text-center text-zinc-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">All caught up!</p>
              </div>
            ) : (
              hotLeads.map((lead) => (
                <button
                  key={lead['Phone Number']}
                  onClick={() => {
                    navigate(`/leads?search=${encodeURIComponent(lead['Phone Number'])}`);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Flame size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {lead['User Name'] || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">{lead['Phone Number']}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-red-500">{lead.scoring.score}</span>
                    <ChevronRight size={12} className="text-zinc-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div className="border-t border-black/5 dark:border-white/5 p-2">
              <button
                onClick={() => { navigate('/leads?bucket=Hot'); setOpen(false); }}
                className="w-full py-2 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-500/5 rounded-xl transition-colors"
              >
                View all hot leads →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
