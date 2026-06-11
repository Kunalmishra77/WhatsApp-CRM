import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Smile, 
  Meh, 
  Frown, 
  Target, 
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  BarChart3,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { EmptyState } from '../../ui/EmptyState';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Skeleton } from '../../ui/Skeleton';
import { RangeControl } from '../../components/Range/RangeControl';
import { useRange } from '../../state/globalRangeStore';
import { dataApi, type LeadInsightRow, type LeadInsightsSummary } from '../../data/api';
import { cn } from '../../lib/utils';

const LeadInsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { from, to, preset } = useRange();
  const range = { from, to };

  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useQuery<LeadInsightsSummary>({
    queryKey: ['lead-insights-summary', preset, from, to],
    queryFn: () => dataApi.fetchLeadInsightsSummary(range),
  });

  const handleGenerateInsights = () => {
    queryClient.invalidateQueries({ queryKey: ['lead-insights-summary'] });
    toast.success('Intelligence refreshed.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader 
        title="AI Lead Insights" 
        subtitle="Behavioral signal synthesis and conversion probability matrix."
        actions={
          <>
            <RangeControl />
            <Button variant="primary" size="sm" onClick={handleGenerateInsights} className="rounded-2xl px-6 shadow-lg shadow-teal-500/20">
              <Sparkles size={14} className="mr-2" /> Sync Intelligence
            </Button>
          </>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[420px] items-stretch">
        {/* Sentiment Trend */}
        <Card className="lg:col-span-2 p-8 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase flex items-center gap-2">
                <BrainCircuit size={20} className="text-teal-500" /> Sentiment Pulse
              </h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Emotional tracking.</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-zinc-500 uppercase">Pos</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[9px] font-black text-zinc-500 uppercase">Neg</span></div>
            </div>
          </div>

          <div className="flex-1 w-full relative min-h-0">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-3xl">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <AreaChart data={summary?.sentimentTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#71717a' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#71717a' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                />
                <Area type="monotone" dataKey="pos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPos)" />
                <Area type="monotone" dataKey="neu" stroke="#71717a" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="neg" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorNeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Concern Distribution */}
        <Card className="p-8 flex flex-col h-full overflow-hidden">
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase mb-1 shrink-0">Common Concerns</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 shrink-0">Market signals.</p>
          
          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-1 min-h-0">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
            ) : summary?.topConcerns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20"><Target size={40} /></div>
            ) : (
              summary?.topConcerns.map((conc, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 flex items-center justify-between group hover:border-teal-500/20 transition-all shrink-0">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{conc.name}</span>
                  </div>
                  <Badge variant="zinc" className="text-[10px] tabular-nums font-black">{conc.count}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* High Intent Entities */}
      <div className="grid grid-cols-1 gap-8">
        <SectionCard 
          title="Conversion Probability Matrix" 
          subtitle="Top entities ranked by AI intent scoring and behavioral signals."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)
            ) : summary?.highIntentLeads.length === 0 ? (
              <div className="col-span-full py-20 text-center text-zinc-500 uppercase text-[10px] font-black tracking-widest italic opacity-50">No high-intent signals found in range</div>
            ) : (
              summary?.highIntentLeads.map((lead) => (
                <Card 
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="p-6 flex flex-col justify-between hover:border-teal-500/40 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden h-52 bg-white dark:bg-[#09090b]/40 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black">
                        {lead['User Name']?.[0] || 'U'}
                      </div>
                      <Badge variant="danger" className="text-[8px] animate-pulse">HOT</Badge>
                    </div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-1">{lead['User Name'] || 'Unknown'}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 mt-0.5">{lead['Phone Number']}</p>
                    <p className="text-[11px] font-medium text-zinc-400 line-clamp-2 mt-3 italic leading-relaxed">
                      "{lead.concern}"
                    </p>
                  </div>
                  
                  <div className="mt-auto relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-teal-500 font-black text-[10px] uppercase tracking-tighter">
                      <TrendingUp size={12} /> Score {lead.scoring.score}
                    </div>
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 opacity-0 group-hover:opacity-100 transition-all">
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Zap size={80} />
                  </div>
                </Card>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default LeadInsightsPage;
