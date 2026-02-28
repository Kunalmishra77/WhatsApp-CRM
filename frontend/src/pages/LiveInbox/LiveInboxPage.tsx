import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Inbox, 
  MessageSquarePlus, 
  Wifi, 
  Activity, 
  User, 
  ArrowRight, 
  Zap, 
  Clock,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { EmptyState } from '../../ui/EmptyState';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Skeleton } from '../../ui/Skeleton';
import { Card } from '../../ui/Card';
import { RangeControl } from '../../components/Range/RangeControl';
import { useRange } from '../../state/globalRangeStore';
import { formatRangeLabel } from '../../utils/dateRange';
import { dataApi } from '../../data/api';
import { cn } from '../../lib/utils';

const LiveInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { from, to, preset } = useRange();
  const range = { from, to };

  // Fetch all sessions in range to act as our live stream
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['live-sessions', preset, from, to],
    queryFn: () => dataApi.fetchSessions(range),
    refetchInterval: 10000, // Poll every 10 seconds for "Live" feel
  });

  const liveSignals = useMemo(() => {
    if (!sessions) return [];
    return sessions.slice(0, 15); // Show top 15 for the live feed
  }, [sessions]);

  const handleOpenChat = (sessionId: string) => {
    navigate(`/conversations?sessionId=${sessionId}`);
    toast.success("Opening live session...");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader 
        title="Live Inbox" 
        subtitle="Real-time signal interceptor and active sessions."
        actions={
          <>
            <div className="flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
               <Wifi size={14} className="animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Signal Active</span>
            </div>
            <RangeControl />
            <Button variant="primary" size="sm" onClick={() => toast.info("Initializing broadcast matrix...")} className="rounded-2xl px-6">
              <MessageSquarePlus size={14} className="mr-2" /> New Broadcast
            </Button>
          </>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-280px)] min-h-[500px] items-stretch">
        {/* Left: Live Signal Stream */}
        <div className="lg:col-span-8 h-full min-h-0">
          <SectionCard 
            title="Intelligence Stream" 
            subtitle="Recent WhatsApp signals."
            className="h-full flex flex-col overflow-hidden"
            overflowHidden={true}
            headerActions={
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0">
                <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
              </Button>
            }
          >
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 min-h-0">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
              ) : liveSignals.length === 0 ? (
                <EmptyState 
                  icon={Inbox}
                  title="Stream Synchronized"
                  description="No active signals detected."
                  ctaText="Manual Refresh"
                  onCtaClick={() => refetch()}
                />
              ) : (
                liveSignals.map((sig) => (
                  <div 
                    key={sig.sessionId}
                    onClick={() => handleOpenChat(sig.sessionId)}
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 hover:border-teal-500/30 transition-all cursor-pointer relative overflow-hidden shrink-0"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-xs group-hover:scale-110 transition-transform">
                        {sig.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{sig.name}</h4>
                          <span className="text-[9px] font-bold text-zinc-400">{sig.phone}</span>
                          {sig.status === 'NA' && <Badge variant="warning" className="text-[7px] px-1.5 py-0 animate-pulse border-none">AI SYNC</Badge>}
                        </div>
                        <p className="text-[10px] font-medium text-zinc-500 line-clamp-1 mt-0.5 italic">
                          "{sig.lastMessage || 'System handshake established...'}"
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 relative z-10">
                      <div className="flex items-center gap-1 text-[8px] font-black text-zinc-400 uppercase tracking-tighter">
                        <Clock size={10} />
                        {format(parseISO(sig.lastTimestamp), 'hh:mm a')}
                      </div>
                      <div className="p-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shadow-sm text-teal-500">
                        <ArrowRight size={12} />
                      </div>
                    </div>

                    {/* Subtle Side Glow */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 transition-all",
                      sig.status === 'NA' ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]" : "bg-teal-500 shadow-[0_0_10px_#14b8a6]"
                    )} />
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right: Monitoring & Status */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 bg-zinc-50/50 dark:bg-[#09090b]/50 border-zinc-200/50 dark:border-white/[0.03] flex flex-col gap-5 shrink-0">
            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic flex items-center gap-2">
              <Activity size={16} className="text-teal-500" /> System Health
            </h3>
            
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Wifi size={14} /></div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Webhook</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]" />
                  <span className="text-[9px] font-black uppercase">ONLINE</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500"><Zap size={14} /></div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Engine</span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_currentColor]" />
                  <span className="text-[9px] font-black uppercase">ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-teal-500/5 border border-teal-500/10 relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Live Monitor</p>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{sessions?.length || 0}</h4>
                  <p className="text-[9px] font-bold text-zinc-500">Active signals.</p>
               </div>
               <Inbox size={40} className="absolute right-[-5px] bottom-[-5px] text-teal-500/10" />
            </div>
          </Card>

          <Card className="p-6 flex flex-col shrink-0">
            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic mb-5">Filters</h3>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start h-10 rounded-xl border-zinc-200/50 dark:border-white/5 opacity-50 cursor-not-allowed">
                <Search size={14} className="mr-3 text-teal-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Search signals</span>
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 rounded-xl border-zinc-200/50 dark:border-white/5 opacity-50 cursor-not-allowed">
                <Filter size={14} className="mr-3 text-teal-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">All Channels</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveInboxPage;
