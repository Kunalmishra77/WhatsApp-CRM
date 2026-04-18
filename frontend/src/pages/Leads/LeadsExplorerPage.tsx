import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  LayoutDashboard, 
  Table as TableIcon,
  Filter,
  Download,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle2,
  Circle,
  MoreVertical,
  ExternalLink,
  Loader2,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  ArrowRight,
  User,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { dataApi, type LeadInsightRow, type TrendPoint, type StagePoint, type FollowUpLead } from '../../data/api';
import { useRange } from '../../state/globalRangeStore';
import { formatRangeLabel } from '../../utils/dateRange';
import { cn } from '../../lib/utils';

// UI Components
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import CustomDropdown from '../../ui/CustomDropdownMenu';
import { FixedDropdown } from '../../ui/FixedDropdown';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { RangeControl } from '../../components/Range/RangeControl';
import { LeadWorkflowModals } from '../../components/Lead/LeadWorkflowModals';

// Charts
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const BUCKET_OPTIONS = [
  { value: 'all', label: 'All Buckets', color: 'zinc' },
  { value: 'Hot', label: 'Hot', color: 'danger' },
  { value: 'Warm', label: 'Warm', color: 'warning' },
  { value: 'Average', label: 'Average', color: 'success' },
  { value: 'Cold', label: 'Cold', color: 'info' },
  { value: 'Converted', label: 'Converted', color: 'teal' },
  { value: 'Unconverted', label: 'Unconverted', color: 'zinc' },
  { value: 'Pending', label: 'Pending', color: 'zinc' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'New', label: 'New' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'FollowUpScheduled', label: 'Follow Up' },
  { value: 'Converted', label: 'Converted' },
  { value: 'Unconverted', label: 'Unconverted' },
  { value: 'Pending', label: 'Pending' },
];

const SENTIMENT_OPTIONS = [
  { value: 'all', label: 'All Sentiments' },
  { value: 'Positive', label: 'Positive' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Negative', label: 'Negative' },
];

const LeadsExplorerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { preset, from, to } = useRange();
  const range = { from, to };
  const queryParams = new URLSearchParams(location.search);

  // --- URL & Basic State ---
  const activeTab = (queryParams.get('tab') as 'overview' | 'table') || 'overview';
  const bucket = queryParams.get('bucket') || 'all';
  const [search, setSearch] = useState(queryParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(queryParams.get('status') || 'all');
  const [sentimentFilter, setSentimentFilter] = useState(queryParams.get('sentiment') || 'all');
  const [workedFilter, setWorkedFilter] = useState<'all' | 'yes' | 'no'>((queryParams.get('worked') as any) || 'all');
  
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [workflowModal, setWorkflowModal] = useState<{ isOpen: boolean; lead: LeadInsightRow | null; type: 'Converted' | 'NotInterested' | 'Closed' | null }>({
    isOpen: false,
    lead: null,
    type: null
  });

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // --- Sync URL helpers ---
  const updateURL = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(location.search);
    Object.entries(params).forEach(([key, val]) => {
      if (val === null || val === 'all') newParams.delete(key);
      else newParams.set(key, val);
    });
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const handleBucketChange = (newBucket: string) => {
    updateURL({ bucket: newBucket });
    setPage(1);
  };

  const handleTabChange = (tab: 'overview' | 'table') => {
    updateURL({ tab });
  };

  // --- Queries ---
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-table', preset, from, to, bucket, statusFilter, search, sentimentFilter, workedFilter],
    queryFn: () => dataApi.fetchLeads({ 
      range, bucket, status: statusFilter, search, sentiment: sentimentFilter, worked: workedFilter 
    }),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['leads-trend', preset, from, to, bucket],
    queryFn: () => dataApi.fetchLeadsTrend(range, preset, bucket),
  });

  const { data: stageDistro, isLoading: stageLoading } = useQuery({
    queryKey: ['leads-stage', preset, from, to, bucket],
    queryFn: () => dataApi.fetchStageDistribution(range, bucket),
  });

  const { data: priorityQueue, isLoading: queueLoading } = useQuery({
    queryKey: ['leads-queue', preset, from, to, bucket],
    queryFn: () => dataApi.fetchTopFollowUps(range, bucket),
  });

  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['leads-funnel', preset, from, to, bucket],
    queryFn: () => dataApi.fetchFunnel(range, bucket),
  });

  const toggleWorkedMutation = useMutation({
    mutationFn: (data: { id: string, phone: string, current: boolean }) => 
      dataApi.toggleWorkedStatus(data.id, data.phone, data.current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-table'] });
      queryClient.invalidateQueries({ queryKey: ['leads-queue'] });
      toast.success("Lead sync: status updated.");
    }
  });

  // --- Table Helpers ---
  const paginatedLeads = useMemo(() => {
    if (!leads) return [];
    return leads.slice((page - 1) * pageSize, page * pageSize);
  }, [leads, page]);

  const totalPages = Math.ceil((leads?.length || 0) / pageSize);

  const getSentimentIcon = (sent: string) => {
    const s = (sent || '').toLowerCase();
    if (s.includes('pos')) return <Smile size={14} className="text-emerald-500" />;
    if (s.includes('neg')) return <Frown size={14} className="text-rose-500" />;
    return <Meh size={14} className="text-amber-500" />;
  };

  const handleExportCSV = () => {
    if (!leads || leads.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const dataToExport = selectedLeads.length > 0 
      ? leads.filter(l => selectedLeads.includes(l.id)) 
      : leads;

    const headers = ["Name", "Phone", "Bucket", "Score", "Sentiment", "Status", "Concern", "Summary", "Next Action", "Created At"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(l => [
        `"${l['User Name']}"`,
        `"${l['Phone Number']}"`,
        l.scoring.bucket,
        l.scoring.score,
        l.sentiment,
        l.status,
        `"${l.concern.replace(/"/g, '""')}"`,
        `"${l['Conversation Summary'].replace(/"/g, '""')}"`,
        `"${l['Action to be taken'].replace(/"/g, '""')}"`,
        l.created_at
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `IndiaGrain_Leads_${bucket}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${dataToExport.length} leads to CSV.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <PageHeader 
        title="Leads Explorer" 
        subtitle={`${bucket === 'all' ? 'Unified' : bucket} Leads Intelligence • ${formatRangeLabel(preset, from, to)}`}
        actions={
          <div className="flex items-center gap-3">
            <RangeControl />
            <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200/50 dark:border-white/10">
              <button
                onClick={() => handleTabChange('overview')}
                className={cn(
                  "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
                  activeTab === 'overview' 
                    ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/5" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                )}
              >
                <LayoutDashboard size={14} /> Overview
              </button>
              <button
                onClick={() => handleTabChange('table')}
                className={cn(
                  "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
                  activeTab === 'table' 
                    ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/5" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                )}
              >
                <TableIcon size={14} /> All Leads
              </button>
            </div>
            <FixedDropdown 
              options={[
                { value: 'csv', label: 'Export Filtered (CSV)' },
                { value: 'xlsx', label: 'Export Filtered (XLSX - Coming)' },
                { value: 'bulk', label: 'Bulk Update (Placeholder)' }
              ]}
              value=""
              placeholder="Actions"
              onChange={(v) => {
                if (v === 'csv') handleExportCSV();
                else toast.info("Feature coming soon: " + v);
              }}
              className="w-40"
            />
          </div>
        }
      />

      {/* Bucket Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {BUCKET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleBucketChange(opt.value)}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
              bucket === opt.value
                ? "bg-teal-500 border-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)] scale-105"
                : "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-teal-500/30 hover:text-zinc-900 dark:hover:text-zinc-300"
            )}
          >
            {opt.label} {opt.value === 'all' ? `(${leads?.length || 0})` : ''}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Leads Trend Chart */}
            <Card className="lg:col-span-2 p-8 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase flex items-center gap-2">
                    <TrendingUp size={20} className="text-teal-500" /> Intelligence Trend
                  </h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Capture velocity for {bucket} bucket.</p>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                {trendLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  </div>
                )}
                <ResponsiveContainer width="100%" height={350} minHeight={350}>
                  <BarChart data={trendData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#71717a' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#71717a' }} />
                    <Tooltip 
                      cursor={false}
                      contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '16px' }}
                      itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="hot" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="warm" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="converted" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Stage Split Donut */}
            <Card className="p-8 flex flex-col min-h-[450px]">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase mb-1">Stage Split</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">Distribution of filtered leads.</p>
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {stageLoading && <Loader2 className="absolute w-8 h-8 text-teal-500 animate-spin" />}
                <ResponsiveContainer width="100%" height={250} minHeight={250}>
                  <PieChart>
                    <Pie
                      data={stageDistro || []}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      onClick={(d) => handleBucketChange(d.name)}
                    >
                      {(stageDistro || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer outline-none hover:opacity-80 transition-opacity" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                   <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{leads?.length || 0}</span>
                   <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Captured</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-8">
                {(stageDistro || []).map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5">
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                    <span className="text-[10px] font-black text-zinc-500 uppercase truncate">{item.name}</span>
                    <span className="ml-auto text-xs font-black tabular-nums">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Priority Queue, Funnel, and Hub Row */}
            <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* Priority Queue */}
              <Card className="p-8 flex flex-col h-full max-h-[500px]">
                <div className="shrink-0">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase mb-1">Priority Queue</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">Unworked leads ranking highest.</p>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                  {queueLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                  ) : (priorityQueue || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                      <CheckCircle2 size={40} />
                      <p className="text-[10px] font-black uppercase mt-4">Queue Clear</p>
                    </div>
                  ) : (priorityQueue || []).map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(`/conversations?phone=${item.phone}`)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 hover:border-teal-500/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center font-black text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform text-xs">{item.name[0]}</div>
                        <div>
                          <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="zinc" size="xs" className="text-[8px] px-1 py-0">{item.score}</Badge>
                            {item.missingCount > 0 && <span className="text-[8px] text-rose-500 font-bold">-{item.missingCount} DATA</span>}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-zinc-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Conversion Funnel */}
              <Card className="p-8 flex flex-col justify-center h-full">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase mb-8 shrink-0">Process Funnel</h3>
                <div className="space-y-6">
                  {(funnelData || []).map((step: any) => (
                    <div 
                      key={step.label} 
                      className="group cursor-pointer"
                      onClick={() => {
                        setStatusFilter(step.label === 'New' ? 'New' : step.label === 'Progress' ? 'InProgress' : step.label === 'Followup' ? 'FollowUpScheduled' : 'Converted');
                        handleTabChange('table');
                      }}
                    >
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-teal-500 transition-colors">{step.label}</span>
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{step.val}</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: step.val }}
                          className={cn("h-full rounded-full transition-all duration-1000", step.color)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Overview Quick Actions */}
              <Card className="p-8 bg-teal-500/[0.02] border-teal-500/10 flex flex-col justify-center h-full">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase mb-8 shrink-0">Intelligence Hub</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start py-6 rounded-2xl border-zinc-200/50 dark:border-white/5" onClick={handleExportCSV}>
                    <Download size={18} className="mr-3" />
                    <span className="text-xs font-black uppercase tracking-widest">Download Full Report</span>
                  </Button>
                  <Button variant="outline" className="justify-start py-6 rounded-2xl border-zinc-200/50 dark:border-white/5" onClick={() => toast.info("Bulk update engine initializing...")}>
                    <Zap size={18} className="mr-3" />
                    <span className="text-xs font-black uppercase tracking-widest">Bulk Update Signals</span>
                  </Button>
                  <Button variant="primary" className="justify-start py-6 rounded-2xl shadow-lg shadow-teal-500/10" onClick={() => toast.success("Opening assignment matrix...")}>
                    <User size={18} className="mr-3" />
                    <span className="text-xs font-black uppercase tracking-widest">Assign Ownership</span>
                  </Button>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Filters Bar */}
            <Card overflowHidden={false} className="relative z-20 p-4 bg-white dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search name, phone, concern..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    updateURL({ search: e.target.value });
                  }}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>
              
              <CustomDropdown 
                options={STATUS_OPTIONS} 
                value={statusFilter} 
                onChange={(v) => { setStatusFilter(v); updateURL({ status: v }); }} 
                className="w-40"
              />
              
              <CustomDropdown 
                options={SENTIMENT_OPTIONS} 
                value={sentimentFilter} 
                onChange={(v) => { setSentimentFilter(v); updateURL({ sentiment: v }); }} 
                className="w-40"
              />

              <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
                <button 
                  onClick={() => { setWorkedFilter('all'); updateURL({ worked: 'all' }); }}
                  className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", workedFilter === 'all' ? "bg-white dark:bg-zinc-800 text-teal-500 shadow-sm" : "text-zinc-500")}
                >
                  All
                </button>
                <button 
                  onClick={() => { setWorkedFilter('yes'); updateURL({ worked: 'yes' }); }}
                  className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", workedFilter === 'yes' ? "bg-white dark:bg-zinc-800 text-teal-500 shadow-sm" : "text-zinc-500")}
                >
                  Worked
                </button>
                <button 
                  onClick={() => { setWorkedFilter('no'); updateURL({ worked: 'no' }); }}
                  className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", workedFilter === 'no' ? "bg-white dark:bg-zinc-800 text-teal-500 shadow-sm" : "text-zinc-500")}
                >
                  Untouched
                </button>
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setSentimentFilter('all');
                  setWorkedFilter('all');
                  handleBucketChange('all');
                  navigate(location.pathname);
                }}
              >
                Reset
              </Button>
            </Card>

            {/* Scannable Executive Table */}
            <Card className="border border-zinc-200 dark:border-none shadow-sm dark:shadow-2xl bg-white dark:bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col min-h-[600px]">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200/50 dark:border-white/5">
                      <th className="p-6 w-12">
                        <div className="cursor-pointer text-zinc-400" onClick={() => setSelectedLeads(selectedLeads.length === paginatedLeads.length ? [] : paginatedLeads.map(l => l.id))}>
                          {selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0 ? <CheckCircle2 size={18} className="text-teal-500" /> : <Circle size={18} />}
                        </div>
                      </th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Analysis</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Status</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Entity</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Concern</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sync Summary</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Data</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Worked</th>
                      <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/50 dark:divide-white/5">
                    {leadsLoading ? (
                      Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={9} className="p-6"><Skeleton className="h-16 w-full rounded-2xl" /></td></tr>)
                    ) : paginatedLeads.length === 0 ? (
                      <tr><td colSpan={9} className="p-32 text-center text-zinc-500 font-bold uppercase tracking-widest italic opacity-50">No leads match filters</td></tr>
                    ) : paginatedLeads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="group hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => navigate(`/conversations?phone=${lead['Phone Number']}`)}
                      >
                        <td className="p-6" onClick={(e) => { e.stopPropagation(); setSelectedLeads(prev => prev.includes(lead.id) ? prev.filter(i => i !== lead.id) : [...prev, lead.id]); }}>
                          <div className="text-zinc-400 transition-colors">
                            {selectedLeads.includes(lead.id) ? <CheckCircle2 size={18} className="text-teal-500" /> : <Circle size={18} />}
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <div className="flex flex-col gap-1.5">
                            <Badge variant={lead.scoring.bucket === 'Hot' ? 'danger' : lead.scoring.bucket === 'Warm' ? 'warning' : lead.scoring.bucket === 'Average' ? 'success' : 'info'} className="w-fit text-[8px] uppercase">{lead.scoring.bucket}</Badge>
                            <span className="text-[10px] font-black tabular-nums text-zinc-500">SCORE {lead.scoring.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <Badge variant={lead.status === 'Converted' ? 'success' : lead.status === 'Unconverted' ? 'danger' : 'zinc'} className="text-[8px] uppercase">{lead.status || 'Pending'}</Badge>
                        </td>
                        <td className="px-4 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-teal-600 transition-colors">{lead['User Name'] || 'Unknown'}</span>
                            <span className="text-[10px] font-bold text-zinc-500 tracking-tighter">{lead['Phone Number']}</span>
                          </div>
                        </td>
                        <td className="px-4 py-6 max-w-[180px]">
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1">{lead.concern}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {getSentimentIcon(lead.sentiment)}
                            <span className="text-[9px] font-black uppercase text-zinc-400">{lead.sentiment || 'Neutral'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-6 max-w-[250px]">
                          <p className="text-[11px] font-medium text-zinc-500 line-clamp-2 leading-relaxed">"{lead['Conversation Summary']}"</p>
                          <div className="text-teal-600 font-black text-[8px] uppercase mt-1 flex items-center gap-1"><ArrowRight size={10} /> {lead['Action to be taken']}</div>
                        </td>
                        <td className="px-4 py-6">
                          <div className="flex gap-1">
                            {!lead.scoring.reasons.some(r => r.includes('Location')) && <Badge variant="zinc" className="bg-rose-500/5 text-rose-500 border-rose-500/10 text-[8px]">NO_LOC</Badge>}
                            {!lead.scoring.reasons.some(r => r.includes('Capacity')) && <Badge variant="zinc" className="bg-rose-500/5 text-rose-500 border-rose-500/10 text-[8px]">NO_TPH</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleWorkedMutation.mutate({ id: lead.id, phone: lead['Phone Number'], current: !!lead.worked }); }}
                            className={cn("w-10 h-5 rounded-full relative transition-all", lead.worked ? "bg-teal-500" : "bg-zinc-200 dark:bg-zinc-800")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", lead.worked ? "right-1" : "left-1")} />
                          </button>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {lead.status === 'Pending' && (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setWorkflowModal({ isOpen: true, lead, type: 'Converted' }); }}
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setWorkflowModal({ isOpen: true, lead, type: 'NotInterested' }); }}
                                  className="p-2 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  <History size={14} />
                                </button>
                              </>
                            )}
                            <button className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-teal-500 transition-colors">
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.01]">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Page {page} of {totalPages || 1} • {leads?.length || 0} Total</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 rounded-lg"><ChevronLeft size={14} /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="h-8 rounded-lg"><ChevronRight size={14} /></Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadWorkflowModals
        isOpen={workflowModal.isOpen}
        onClose={() => setWorkflowModal({ ...workflowModal, isOpen: false })}
        lead={workflowModal.lead}
        type={workflowModal.type}
      />
    </div>
  );
};

export default LeadsExplorerPage;
