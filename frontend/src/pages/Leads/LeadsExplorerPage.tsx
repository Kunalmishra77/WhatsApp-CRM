import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  ExternalLink,
  CheckCircle2,
  Circle,
  Calendar,
  Smile,
  Meh,
  Frown,
  Zap,
  Info
} from 'lucide-react';
import { dataApi } from '../../data/api';
import type { LeadInsightRow } from '../../data/api';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CustomDropdown } from '../../ui/CustomDropdown';
import { Skeleton } from '../../ui/Skeleton';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const BUCKET_OPTIONS = [
  { value: 'all', label: 'All Buckets' },
  { value: 'Hot', label: 'Hot Leads' },
  { value: 'Warm', label: 'Warm Leads' },
  { value: 'Average', label: 'Average Leads' },
  { value: 'Cold', label: 'Cold Leads' },
];

const SENTIMENT_OPTIONS = [
  { value: 'all', label: 'All Sentiments' },
  { value: 'Positive', label: 'Positive' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Negative', label: 'Negative' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'New', label: 'New' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'FollowUpScheduled', label: 'Follow Up' },
  { value: 'Converted', label: 'Converted' },
];

const MISSING_OPTIONS = [
  { value: 'all', label: 'All Data' },
  { value: 'location', label: 'Missing Location' },
  { value: 'capacity', label: 'Missing Capacity' },
];

const LeadsExplorerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // URL State
  const initialBucket = queryParams.get('bucket') || 'all';
  const initialStatus = queryParams.get('status') || 'all';
  const from = queryParams.get('from') || '';
  const to = queryParams.get('to') || '';

  // Local UI State
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState(initialBucket);
  const [status, setStatus] = useState(initialStatus);
  const [sentiment, setSentiment] = useState('all');
  const [missing, setMissing] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads-explorer', { from, to, bucket, status, search, sentiment, missing }],
    queryFn: () => dataApi.fetchLeads({ 
      range: { from, to }, 
      bucket, 
      status,
      search, 
      sentiment,
      missing
    }),
    enabled: !!from && !!to,
  });

  const paginatedLeads = useMemo(() => {
    if (!leads) return [];
    return leads.slice((page - 1) * pageSize, page * pageSize);
  }, [leads, page]);

  const totalPages = Math.ceil((leads?.length || 0) / pageSize);

  const handleExport = () => {
    toast.success(`Exporting ${selectedLeads.length || leads?.length} leads to CSV`);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map(l => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getSentimentIcon = (sent: string) => {
    const s = (sent || '').toLowerCase();
    if (s.includes('pos')) return <Smile size={14} className="text-emerald-500" />;
    if (s.includes('neg')) return <Frown size={14} className="text-rose-500" />;
    return <Meh size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-zinc-100">
            Leads <span className="font-light text-zinc-500">Explorer</span>
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
               Managing <span className="text-zinc-900 dark:text-zinc-100 font-bold">{leads?.length || 0}</span> synthesized insights.
             </p>
             {from && (
               <Badge variant="teal" className="bg-teal-500/5 border-teal-500/10">
                 <Calendar size={10} className="mr-1" /> {from} – {to}
               </Badge>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 dark:bg-[#0f0f12]/50 p-2 rounded-[1.5rem] border border-zinc-200/50 dark:border-white/5 shadow-xl backdrop-blur-md overflow-x-auto no-scrollbar">
          <div className="relative group w-40 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-xs font-bold outline-none placeholder:text-zinc-500 dark:text-zinc-100"
            />
          </div>
          <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 shrink-0" />
          <CustomDropdown 
            options={BUCKET_OPTIONS} 
            value={bucket} 
            onChange={setBucket}
            className="w-32 shrink-0"
          />
          <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 shrink-0" />
          <CustomDropdown 
            options={STATUS_OPTIONS} 
            value={status} 
            onChange={setStatus}
            className="w-32 shrink-0"
          />
          <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 shrink-0" />
          <CustomDropdown 
            options={MISSING_OPTIONS} 
            value={missing} 
            onChange={setMissing}
            className="w-36 shrink-0"
          />
          <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 shrink-0" />
          <CustomDropdown 
            options={SENTIMENT_OPTIONS} 
            value={sentiment} 
            onChange={setSentiment}
            className="w-36 shrink-0"
          />
          <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 shrink-0" />
          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl border-none hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <Download size={14} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-none shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200/50 dark:border-white/5">
                <th className="p-6 w-12">
                  <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-teal-500 transition-colors">
                    {selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0 ? <CheckCircle2 size={18} className="text-teal-500" /> : <Circle size={18} />}
                  </button>
                </th>
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Analysis</th>
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Lead Entity</th>
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Concern & Signal</th>
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Synthesis</th>
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Completeness</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-white/5">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-6"><Skeleton className="h-16 w-full rounded-2xl" /></td>
                  </tr>
                ))
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Filter size={40} className="text-zinc-200 dark:text-zinc-800" />
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No matching insights found</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedLeads.map((lead) => (
                <tr 
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="group hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="p-6" onClick={(e) => { e.stopPropagation(); toggleSelectOne(lead.id); }}>
                    <div className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                      {selectedLeads.includes(lead.id) ? <CheckCircle2 size={18} className="text-teal-500" /> : <Circle size={18} />}
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex flex-col items-start gap-2">
                      <Badge 
                        variant={lead.scoring.bucket === 'Hot' ? 'danger' : lead.scoring.bucket === 'Warm' ? 'warning' : lead.scoring.bucket === 'Average' ? 'success' : 'info'}
                        className="rounded-lg px-2 py-1 shadow-sm"
                      >
                        {lead.scoring.bucket}
                      </Badge>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                         <div className="w-1 h-1 rounded-full bg-teal-500" />
                         <span className="text-[10px] font-black tabular-nums">{lead.scoring.score}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{lead['User Name'] || 'Unknown'}</span>
                      <span className="text-[10px] font-bold text-zinc-500 tracking-tighter mt-0.5">{lead['Phone Number']}</span>
                    </div>
                  </td>
                  <td className="px-4 py-6 max-w-xs">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1">{lead.concern}</p>
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 w-fit">
                        {getSentimentIcon(lead.sentiment)}
                        <span className="text-[10px] font-black uppercase text-zinc-500">{lead.sentiment || 'Neutral'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6 max-w-sm">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[11px] font-medium text-zinc-500 line-clamp-2 leading-relaxed italic">"{lead['Conversation Summary']}"</p>
                      <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-black text-[9px] uppercase tracking-wider">
                        <Zap size={10} fill="currentColor" strokeWidth={0} /> {lead['Action to be taken'] || 'Wait for signal'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex flex-wrap gap-1.5">
                      {lead.scoring.reasons.some(r => r.includes('Location')) ? (
                        <Badge variant="teal" size="xs" className="opacity-50">LOCATION</Badge>
                      ) : (
                        <Badge variant="zinc" size="xs" className="bg-rose-500/5 text-rose-500 border-rose-500/10">NO_LOC</Badge>
                      )}
                      {lead.scoring.reasons.some(r => r.includes('Capacity')) ? (
                        <Badge variant="teal" size="xs" className="opacity-50">CAPACITY</Badge>
                      ) : (
                        <Badge variant="zinc" size="xs" className="bg-rose-500/5 text-rose-500 border-rose-500/10">NO_TPH</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100">{new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(lead.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm text-zinc-500 hover:text-teal-500 transition-colors">
                          <Info size={14} />
                        </button>
                        <button className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm text-zinc-500 hover:text-teal-500 transition-colors">
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between bg-zinc-50/30 dark:bg-white/[0.01]">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
            Page <span className="text-zinc-900 dark:text-zinc-100">{page}</span> of {totalPages}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 rounded-xl"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 rounded-xl"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LeadsExplorerPage;
