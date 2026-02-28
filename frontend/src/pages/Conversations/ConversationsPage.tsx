import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  MessageSquare, 
  Zap, 
  Clock, 
  User, 
  Bot, 
  Send, 
  Info,
  Phone,
  Calendar,
  Smile,
  Meh,
  Frown,
  ArrowRight,
  Loader2,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { dataApi } from '../../data/api';
import type { ChatSession, ChatMessage, LeadInsightRow } from '../../data/api';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';
import { useRange } from '../../state/globalRangeStore';
import { RangeControl } from '../../components/Range/RangeControl';
import { LeadWorkflowModals } from '../../components/Lead/LeadWorkflowModals';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const ConversationsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preset, from, to, setPreset, setCustomRange } = useRange();
  const range = { from, to };
  const queryParams = new URLSearchParams(location.search);
  
  // URL Params Sync
  useEffect(() => {
    const p = queryParams.get('preset');
    const f = queryParams.get('from');
    const t = queryParams.get('to');

    if (p && p !== preset) {
      if (p === 'custom' && f && t) {
        setCustomRange(f, t);
      } else if (p !== 'custom') {
        setPreset(p as any);
      }
    }
  }, [location.search]);

  // State
  const [searchTerm, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(queryParams.get('sessionId'));
  const filter = queryParams.get('filter') || 'all';

  const [workflowModal, setWorkflowModal] = useState<{ isOpen: boolean; lead: LeadInsightRow | null; type: 'Converted' | 'NotInterested' | 'Closed' | null }>({
    isOpen: false,
    lead: null,
    type: null
  });
  
  // 1. Fetch all sessions in range
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions', preset, from, to],
    queryFn: () => dataApi.fetchSessions(range),
  });

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    let results = sessions;

    // Apply URL filter (NA, Done, active, all)
    if (filter === 'na') {
      results = results.filter(s => s.status === 'NA');
    } else if (filter === 'done') {
      results = results.filter(s => s.status === 'Done');
    }
    // 'active' filter logic could be added if defined, for now 'all' handles it.

    return results.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.phone.includes(searchTerm)
    );
  }, [sessions, searchTerm, filter]);

  // Handle drilldown from /leads (match by phone if no sessionId)
  const drilldownPhone = queryParams.get('phone');
  useEffect(() => {
    if (!selectedSessionId && drilldownPhone && sessions) {
      const match = sessions.find(s => s.phone === drilldownPhone);
      if (match) setSelectedSessionId(match.sessionId);
    }
  }, [drilldownPhone, sessions, selectedSessionId]);

  const selectedSession = useMemo(() => 
    sessions?.find(s => s.sessionId === selectedSessionId),
    [sessions, selectedSessionId]
  );

  // 2. Fetch conversation messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedSessionId],
    queryFn: () => dataApi.fetchConversation(selectedSessionId!),
    enabled: !!selectedSessionId,
  });

  // 3. Fetch Lead Insight for the selected contact
  const { data: insight, isLoading: insightLoading } = useQuery({
    queryKey: ['lead-insight-detail', selectedSession?.phone],
    queryFn: () => dataApi.fetchLeadInsightByPhone(selectedSession!.phone),
    enabled: !!selectedSession?.phone,
  });

  const getSentimentIcon = (sent: string) => {
    const s = (sent || '').toLowerCase();
    if (s.includes('pos')) return <Smile size={14} className="text-emerald-500" />;
    if (s.includes('neg')) return <Frown size={14} className="text-rose-500" />;
    return <Meh size={14} className="text-amber-500" />;
  };

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6 animate-in fade-in duration-500">
      
      {/* 1. Sessions List (Left) */}
      <div className="w-80 flex flex-col gap-4">
        <RangeControl />
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-teal-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 shadow-sm"
          />
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border border-zinc-200 dark:border-none shadow-sm dark:shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-xl">
          <div className="p-4 border-b border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-transparent">
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Conversations</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {sessionsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2 border-b border-zinc-200/50 dark:border-white/5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : filteredSessions.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest italic opacity-50">No sessions found</div>
            ) : filteredSessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => setSelectedSessionId(session.sessionId)}
                className={cn(
                  "w-full p-4 text-left border-b border-zinc-200/50 dark:border-white/5 transition-all hover:bg-zinc-100/50 dark:hover:bg-white/[0.02]",
                  selectedSessionId === session.sessionId && "bg-teal-500/5 dark:bg-teal-500/[0.03] border-l-4 border-l-teal-500"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate pr-2">{session.name}</span>
                  <Badge variant={session.status === 'Done' ? 'teal' : 'zinc'} size="xs" className="shrink-0 scale-75 origin-right">
                    {session.status}
                  </Badge>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 tracking-tighter mb-2">{session.phone}</p>
                <p className="text-[11px] text-zinc-400 line-clamp-1 italic">"{session.lastMessage || '...'}"</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* 2. Chat Stream (Center) */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden border border-zinc-200 dark:border-none shadow-sm dark:shadow-2xl bg-white/90 dark:bg-[#09090b]/60 backdrop-blur-2xl">
          {!selectedSessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30 text-center">
               <MessageSquare size={60} strokeWidth={1} className="mb-4 text-teal-500" />
               <h3 className="text-lg font-black uppercase italic tracking-tighter">Select a session</h3>
               <p className="text-xs font-bold uppercase tracking-widest max-w-xs mt-2">Pick an intelligence stream from the left to view synthesis.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-zinc-200/50 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tight">{selectedSession?.name}</h3>
                    <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">{selectedSession?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="rounded-xl"><Calendar size={18} /></Button>
                   <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical size={18} /></Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
                {messagesLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={cn("flex gap-4", i % 2 === 0 ? "flex-row" : "flex-row-reverse")}>
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <Skeleton className="h-20 w-2/3 rounded-3xl" />
                    </div>
                  ))
                ) : messages?.map((msg) => (
                  <div key={msg.id} className="space-y-6">
                    {/* User Message */}
                    {msg.user_msg && (
                      <div className="flex items-start gap-4 animate-in slide-in-from-left-4 duration-500">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 shrink-0 border border-zinc-200/50 dark:border-white/10 shadow-sm">
                          <User size={18} />
                        </div>
                        <div className="max-w-[80%]">
                          <div className="bg-zinc-100/80 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 p-5 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl shadow-sm">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">{msg.user_msg}</p>
                          </div>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-2 ml-1 inline-block">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )}

                    {/* Bot Response */}
                    {msg.bot_msg && (
                      <div className="flex items-start gap-4 flex-row-reverse animate-in slide-in-from-right-4 duration-500">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                          <Bot size={18} />
                        </div>
                        <div className="max-w-[80%] text-right">
                          <div className="bg-teal-500/5 dark:bg-teal-500/[0.03] border border-teal-500/20 p-5 rounded-tl-3xl rounded-bl-3xl rounded-br-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">{msg.bot_msg}</p>
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-2 mr-1">
                             <Badge variant="teal" className="text-[8px] px-1.5 h-4 opacity-50">{msg.stage}</Badge>
                             <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-zinc-200/50 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.01]">
                 <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Type a message to synchronize..."
                      className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[1.5rem] py-4 pl-6 pr-16 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all shadow-sm"
                    />
                    <Button variant="primary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-2xl shadow-sm">
                       <Send size={18} />
                    </Button>
                 </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 3. Insight Panel (Right) */}
      <div className="w-96 flex flex-col gap-6">
        <Card className="p-8 border border-teal-500/10 dark:border-none shadow-sm dark:shadow-2xl bg-teal-50/50 dark:bg-[#14b8a6]/[0.03] backdrop-blur-xl relative overflow-hidden group">
           <div className="relative z-10">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                <Zap size={18} className="text-teal-500" /> Synthesis Result
              </h3>
              
              {insightLoading ? (
                <div className="space-y-6">
                   <Skeleton className="h-20 w-full rounded-2xl" />
                   <Skeleton className="h-10 w-full rounded-xl" />
                   <Skeleton className="h-32 w-full rounded-3xl" />
                </div>
              ) : !insight ? (
                <div className="space-y-6 text-center py-10 opacity-50">
                   <div className="w-16 h-16 bg-zinc-200 dark:bg-white/5 rounded-3xl flex items-center justify-center text-zinc-400 mx-auto mb-4">
                      <AlertCircle size={32} strokeWidth={1.5} />
                   </div>
                   <h4 className="text-xs font-black uppercase tracking-widest">No Active Synthesis</h4>
                   <p className="text-[10px] font-medium leading-relaxed">This contact has not yet been processed by the AI synthesis engine.</p>
                   <Button variant="outline" className="w-full rounded-2xl py-6 border-dashed text-[10px] font-black uppercase tracking-widest">Create Temporary Note</Button>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                   <div className="flex items-center justify-between">
                      <Badge variant={insight.scoring.bucket === 'Hot' ? 'danger' : insight.scoring.bucket === 'Warm' ? 'warning' : 'success'} className="px-3 py-1 text-[10px]">
                        {insight.scoring.bucket} LEADS
                      </Badge>
                      <div className="text-right">
                         <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{insight.scoring.score}</span>
                         <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Lead Score</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sentiment Analysis</span>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                         {getSentimentIcon(insight.sentiment)}
                         <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{insight.sentiment || 'Neutral'}</span>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Conversation Summary</span>
                      <Card className="p-5 bg-white dark:bg-[#09090b]/40 border border-zinc-200 dark:border-none shadow-sm italic text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                         "{insight['Conversation Summary']}"
                      </Card>
                   </div>

                   <div className="space-y-3">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recommended Action</span>
                      <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center gap-3">
                         <ArrowRight size={16} />
                         {insight['Action to be taken'] || 'Monitor for signals'}
                      </div>
                   </div>

                   <div className="pt-4 grid grid-cols-2 gap-3">
                      {insight.scoring.reasons.some(r => r.includes('Location')) ? (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-tighter text-center">LOCATION OK</div>
                      ) : (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-tighter text-center">NO LOCATION</div>
                      )}
                      {insight.scoring.reasons.some(r => r.includes('Capacity')) ? (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-tighter text-center">CAPACITY OK</div>
                      ) : (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-tighter text-center">NO CAPACITY</div>
                      )}
                   </div>

                   {/* Workflow Actions */}
                   <div className="pt-6 border-t border-zinc-200/50 dark:border-white/5 space-y-3">
                      {insight.status === 'Pending' ? (
                        <div className="grid grid-cols-2 gap-3">
                           <Button 
                             variant="primary" 
                             className="rounded-2xl py-6"
                             onClick={() => setWorkflowModal({ isOpen: true, lead: insight, type: 'Converted' })}
                           >
                              Convert
                           </Button>
                           <Button 
                             variant="danger" 
                             className="rounded-2xl py-6"
                             onClick={() => setWorkflowModal({ isOpen: true, lead: insight, type: 'NotInterested' })}
                           >
                              Drop
                           </Button>
                        </div>
                      ) : (
                        <div className={cn(
                          "p-4 rounded-2xl border text-center font-black uppercase tracking-[0.2em] text-xs",
                          insight.status === 'Converted' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        )}>
                          Status: {insight.status}
                        </div>
                      )}
                   </div>
                </div>
              )}
           </div>
           
           {/* Background Decoration */}
           <Zap size={120} className="absolute right-[-20px] bottom-[-20px] text-teal-500/5 group-hover:scale-110 transition-transform duration-700" fill="currentColor" strokeWidth={0} />
        </Card>

        <Button variant="primary" className="w-full py-6 rounded-[1.5rem] shadow-xl shadow-teal-500/10" onClick={() => toast.success("Opening detailed profile...")}>
           View Detailed Intelligence Profile
        </Button>
      </div>

      <LeadWorkflowModals 
        isOpen={workflowModal.isOpen}
        onClose={() => setWorkflowModal({ ...workflowModal, isOpen: false })}
        lead={workflowModal.lead}
        type={workflowModal.type}
      />
    </div>
  );
};

export default ConversationsPage;
