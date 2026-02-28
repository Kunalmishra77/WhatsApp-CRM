import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Flame, 
  Zap, 
  IceCream, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Plus,
  Loader2,
  MessageSquare,
  Activity,
  UserPlus,
  FileClock,
  FileSearch,
  Clock,
  Calendar
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { dataApi } from '../../data/api';
import type { KPIStats, TrendPoint, StagePoint, FollowUpLead, WhatsAppPulse, WhatsAppTrendPoint } from '../../data/api';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../ui/PageHeader';
import { getRangeFromPreset, formatRangeLabel, type DatePreset } from '../../utils/dateRange';
import { FixedDropdown } from '../../ui/FixedDropdown';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = React.useState(false);

  // --- Local Range States ---
  const [stagePreset, setStagePreset] = React.useState<DatePreset>('monthly');
  const [leadsPreset, setLeadsPreset] = React.useState<DatePreset>('weekly');
  const [waPreset, setWaPreset] = React.useState<DatePreset>('daily');

  const stageRange = React.useMemo(() => getRangeFromPreset(stagePreset), [stagePreset]);
  const leadsRange = React.useMemo(() => getRangeFromPreset(leadsPreset), [leadsPreset]);
  const waRange = React.useMemo(() => getRangeFromPreset(waPreset), [waPreset]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const PRESET_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  // Queries
  const { data: kpis } = useQuery<KPIStats>({
    queryKey: ['dashboard-kpis', stagePreset],
    queryFn: () => dataApi.fetchDashboardKPIs(stageRange),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery<TrendPoint[]>({
    queryKey: ['dashboard-trend', leadsPreset],
    queryFn: () => dataApi.fetchLeadsTrend(leadsRange, leadsPreset),
  });

  const { data: stageDistro } = useQuery<StagePoint[]>({
    queryKey: ['dashboard-stage', stagePreset],
    queryFn: () => dataApi.fetchStageDistribution(stageRange),
  });

  const { data: followUps } = useQuery<FollowUpLead[]>({
    queryKey: ['dashboard-followups'],
    queryFn: () => dataApi.fetchTopFollowUps(stageRange),
  });

  const { data: waPulse } = useQuery<WhatsAppPulse>({
    queryKey: ['dashboard-wa-pulse'],
    queryFn: () => dataApi.fetchWhatsAppPulse(stageRange),
  });

  const { data: waTrend, isLoading: waTrendLoading } = useQuery<WhatsAppTrendPoint[]>({
    queryKey: ['dashboard-wa-trend', waPreset],
    queryFn: () => dataApi.fetchWhatsAppTrend(waRange, waPreset),
  });

  const { data: funnelData } = useQuery({
    queryKey: ['dashboard-funnel'],
    queryFn: () => dataApi.fetchFunnel(stageRange),
  });

  const { data: agentPerformance } = useQuery({
    queryKey: ['dashboard-agents'],
    queryFn: () => dataApi.fetchAgentPerformance(stageRange),
  });

  const handleStatClick = (bucket?: string) => {
    const params = new URLSearchParams();
    params.set('bucket', bucket || 'all');
    navigate(`/leads?${params.toString()}`);
  };

  const handleWAClick = (filter?: string) => {
    const params = new URLSearchParams();
    params.set('preset', waPreset);
    if (filter) params.set('filter', filter);
    navigate(`/conversations?${params.toString()}`);
  };

  const kpiCards = [
    { title: 'Total Leads', value: kpis?.totalLeads ?? '0', change: '+12.5%', isUp: true, icon: Users, color: 'teal', bucket: 'all' },
    { title: 'Hot Leads', value: kpis?.hotLeads ?? '0', change: '+8.2%', isUp: true, icon: Flame, color: 'danger', bucket: 'Hot' },
    { title: 'Warm Leads', value: kpis?.warmLeads ?? '0', change: '-2.4%', isUp: false, icon: Zap, color: 'warning', bucket: 'Warm' },
    { title: 'Cold Leads', value: kpis?.coldLeads ?? '0', change: '+1.5%', isUp: true, icon: IceCream, color: 'info', bucket: 'Cold' },
    { title: 'Converted', value: kpis?.converted ?? '0', change: '+18.3%', isUp: true, icon: CheckCircle2, color: 'success', bucket: 'Converted' },
    { title: 'Lost Leads', value: kpis?.unconverted ?? '0', change: '+2.1%', isUp: false, icon: XCircle, color: 'danger', bucket: 'Unconverted' },
    { title: 'Pending Decisions', value: kpis?.pendingDecisions ?? '0', change: '+4.1%', isUp: true, icon: Clock, color: 'zinc', bucket: 'Pending' },
    { title: 'Avg Score', value: kpis?.avgScore ?? '0', change: '+5.2%', isUp: true, icon: TrendingUp, color: 'teal', bucket: undefined },
  ];

  // Helper for the Local Range UI component
  const LocalRangeSelector = ({ preset, from, to, onChange }: { preset: DatePreset, from: string, to: string, onChange: (val: DatePreset) => void }) => (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/5 border border-teal-500/10 text-teal-600 text-[9px] font-bold uppercase tracking-tighter">
        <Calendar size={10} />
        {formatRangeLabel(preset, from, to)}
      </div>
      <FixedDropdown 
        options={PRESET_OPTIONS}
        value={preset}
        onChange={(val) => onChange(val as DatePreset)}
        className="w-28 h-8 text-[10px]"
      />
    </div>
  );

  return (
    <div className="space-y-10 pb-10 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Command Center" 
        subtitle="Real-time revenue intelligence & operations."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/leads')}>
               <Filter size={14} className="mr-2" /> Filter
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast.success("Campaign Engine initializing...")}>
               <Plus size={14} className="mr-2" /> New Campaign
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div 
            key={kpi.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => kpi.bucket ? handleStatClick(kpi.bucket) : undefined}
            className="cursor-pointer"
          >
            <Card className="p-4 bg-white dark:bg-[#1c1c1e] hover:shadow-md border-black/5 dark:border-white/10 transition-all h-full">
              <div className="flex justify-between items-start mb-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  kpi.color === 'teal' ? "bg-blue-500/10 text-blue-500" :
                  kpi.color === 'danger' ? "bg-red-500/10 text-red-500" :
                  kpi.color === 'warning' ? "bg-orange-500/10 text-orange-500" :
                  kpi.color === 'info' ? "bg-sky-500/10 text-sky-500" :
                  kpi.color === 'success' ? "bg-green-500/10 text-green-500" :
                  "bg-gray-500/10 text-gray-500"
                )}>
                  <kpi.icon size={16} strokeWidth={2.5} />
                </div>
                <div className={cn(
                  "text-[10px] font-bold flex items-center",
                  kpi.isUp ? "text-green-500" : "text-red-500"
                )}>
                  {kpi.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {kpi.change}
                </div>
              </div>
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-tight mb-1">{kpi.title}</h3>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">{kpi.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
         <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-500" /> WhatsApp Pulse
         </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Incoming Chats', value: waPulse?.incomingChats, icon: MessageSquare, filter: 'all' },
          { label: 'Active Sessions', value: waPulse?.activeSessions, icon: Activity, filter: 'active' },
          { label: 'New Contacts', value: waPulse?.newContacts, icon: UserPlus, filter: 'new' },
          { label: 'Pre-Insight', value: waPulse?.preInsightSessions, icon: FileClock, filter: 'na' },
          { label: 'Insight Ready', value: waPulse?.insightReadySessions, icon: FileSearch, filter: 'done' },
        ].map((item) => (
          <Card key={item.label} onClick={() => handleWAClick(item.filter)} className="p-4 cursor-pointer hover:bg-black/5 transition-colors bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><item.icon size={16} /></div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase">{item.label}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{item.value ?? 0}</p>
                </div>
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stage Distribution */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           <div className="flex flex-wrap items-center justify-between gap-2 px-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white whitespace-nowrap">Stage Distribution</h3>
              <LocalRangeSelector 
                preset={stagePreset} 
                from={stageRange.from} 
                to={stageRange.to} 
                onChange={setStagePreset} 
              />
           </div>
           <Card className="p-6 h-[450px] bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm flex flex-col">
              <div className="flex-1 w-full relative min-h-[300px] overflow-hidden">
                {isMounted && stageDistro && stageDistro.length > 0 ? (
                  <div className="absolute inset-0 w-full h-full">
                    <ResponsiveContainer width="99%" height="100%" debounce={1}>
                      <PieChart>
                        <Pie 
                          data={stageDistro} 
                          innerRadius="65%" 
                          outerRadius="85%" 
                          paddingAngle={8} 
                          dataKey="value" 
                          stroke="none"
                          onClick={(data: any) => {
                            if (data?.name) {
                              handleStatClick(data.name);
                            }
                          }}
                        >
                          {stageDistro.map((entry, index) => (
                            <Cell key={index} fill={entry.color} className="outline-none cursor-pointer" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  !trendLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs font-medium">
                      No data available
                    </div>
                  )
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-3xl font-bold text-zinc-900 dark:text-white">{kpis?.totalLeads ?? '0'}</span>
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Leads</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 shrink-0">
                {(stageDistro || []).map((item) => (
                  <div 
                    key={item.name} 
                    onClick={() => handleStatClick(item.name)}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
           </Card>
        </div>

        {/* Stacked Trends */}
        <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Lead Insights */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white whitespace-nowrap">Lead Insights</h3>
                <LocalRangeSelector 
                  preset={leadsPreset} 
                  from={leadsRange.from} 
                  to={leadsRange.to} 
                  onChange={setLeadsPreset} 
                />
              </div>
              <Card className="p-6 h-[240px] bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm flex flex-col overflow-hidden">
                  <div className="flex-1 w-full relative min-h-[180px]">
                    {isMounted && trendData && trendData.length > 0 ? (
                      <div className="absolute inset-0 w-full h-full">
                        <ResponsiveContainer width="99%" height="100%" debounce={1}>
                          <BarChart 
                            data={trendData} 
                            margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                            onClick={(data: any) => {
                              if (data?.activePayload?.[0]?.payload) {
                                const payload = data.activePayload[0].payload;
                                const params = new URLSearchParams();
                                params.set('preset', 'custom');
                                params.set('from', payload.from);
                                params.set('to', payload.to);
                                params.set('bucket', 'all');
                                navigate(`/leads?${params.toString()}`);
                                toast.success(`Drilling down into ${payload.name}`);
                              }
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600', fill: '#8e8e93' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600', fill: '#8e8e93' }} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="hot" name="Hot" fill="#ff3b30" radius={[4, 4, 4, 4]} barSize={8} className="cursor-pointer" />
                            <Bar dataKey="warm" name="Warm" fill="#ff9500" radius={[4, 4, 4, 4]} barSize={8} className="cursor-pointer" />
                            <Bar dataKey="converted" name="Success" fill="#34c759" radius={[4, 4, 4, 4]} barSize={8} className="cursor-pointer" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      !trendLoading && (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs font-medium">
                          No trend data
                        </div>
                      )
                    )}
                  </div>
              </Card>
            </div>

            {/* Conversation Flow */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white whitespace-nowrap">Conversation Flow</h3>
                <LocalRangeSelector 
                  preset={waPreset} 
                  from={waRange.from} 
                  to={waRange.to} 
                  onChange={setWaPreset} 
                />
              </div>
              <Card className="p-6 h-[240px] bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm flex flex-col overflow-hidden">
                  <div className="flex-1 w-full relative min-h-[180px]">
                    {isMounted && waTrend && waTrend.length > 0 ? (
                      <div className="absolute inset-0 w-full h-full">
                        <ResponsiveContainer width="99%" height="100%" debounce={1}>
                          <AreaChart 
                            data={waTrend} 
                            margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                            onClick={(data: any) => {
                              if (data?.activePayload?.[0]?.payload) {
                                const payload = data.activePayload[0].payload;
                                const params = new URLSearchParams();
                                params.set('from', payload.from);
                                params.set('to', payload.to);
                                params.set('preset', 'custom');
                                navigate(`/conversations?${params.toString()}`);
                                toast.info(`Viewing conversations for ${payload.name}`);
                              }
                            }}
                          >
                            <defs>
                              <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#007aff" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600', fill: '#8e8e93' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600', fill: '#8e8e93' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="messages" stroke="#007aff" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" className="cursor-pointer" />
                            <Area type="monotone" dataKey="sessions" stroke="#5856d6" strokeWidth={3} fill="none" className="cursor-pointer" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      !waTrendLoading && (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs font-medium">
                          No traffic data
                        </div>
                      )
                    )}
                  </div>
              </Card>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Priority Queue */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           <h3 className="text-lg font-semibold text-zinc-900 dark:text-white px-2 tracking-tight">Priority Queue</h3>
           <Card className="flex-1 bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 flex flex-col overflow-hidden shadow-sm">
             <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 max-h-[450px]">
               {(followUps || []).map((item, i) => (
                 <div key={i} onClick={() => navigate(`/conversations?phone=${item.phone}`)} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7] dark:bg-white/5 hover:bg-[#e5e5ea] dark:hover:bg-white/10 transition-all cursor-pointer group border border-transparent">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-sm shadow-sm">{item.name[0]}</div>
                     <div>
                       <h4 className="text-[14px] font-semibold text-zinc-900 dark:text-white leading-tight">{item.name}</h4>
                       <p className="text-[11px] text-zinc-500 font-medium mt-0.5 tracking-tight">{item.phone}</p>
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     <Badge variant={item.status === 'Hot' ? 'danger' : item.status === 'Warm' ? 'warning' : 'info'} size="xs" className="rounded-full px-2 py-0.5 text-[9px] font-bold">
                       {item.status}
                     </Badge>
                     <span className="text-[9px] font-medium text-zinc-400">{item.time}</span>
                   </div>
                 </div>
               ))}
             </div>
             <Button variant="ghost" className="w-full text-[13px] font-semibold py-5 border-t border-black/5 rounded-none text-blue-600 hover:bg-[#f5f5f7] dark:hover:bg-white/5">
               View All Follow-ups
             </Button>
           </Card>
        </div>

        {/* Funnel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           <h3 className="text-lg font-semibold text-zinc-900 dark:text-white px-2 tracking-tight">Conversion Funnel</h3>
           <Card className="p-8 bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 flex-1 flex flex-col justify-center shadow-sm">
              <div className="flex items-center justify-between gap-2 relative">
                <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-[#f5f5f7] dark:bg-white/5 -z-0" />
                {(funnelData || []).map((step: any) => (
                  <div 
                    key={step.label} 
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (step.label === 'New') params.set('status', 'Pending');
                      else if (step.label === 'Progress') params.set('status', 'InProgress');
                      else if (step.label === 'Followup') params.set('status', 'FollowUpScheduled');
                      else if (step.label === 'Converted') params.set('status', 'Converted');
                      navigate(`/leads?${params.toString()}`);
                    }}
                    className="flex-1 flex flex-col items-center gap-3 relative z-10 cursor-pointer group"
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg", 
                      step.color === 'bg-teal-500' ? "bg-blue-500" : 
                      step.color === 'bg-emerald-500' ? "bg-green-500" : 
                      step.color === 'bg-amber-500' ? "bg-orange-500" : "bg-red-500"
                    )}>
                      {step.val}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase group-hover:text-zinc-900 transition-colors">{step.label}</span>
                  </div>
                ))}
              </div>
           </Card>
        </div>

        {/* Agent Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           <h3 className="text-lg font-semibold text-zinc-900 dark:text-white px-2 tracking-tight">Agent Performance</h3>
           <Card className="p-8 flex-1 bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm">
              <div className="space-y-8">
                {(agentPerformance || []).map((agent: any) => (
                  <div key={agent.name} className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">{agent.name}</span>
                      <span className="text-[12px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-lg">{agent.conv} Conv</span>
                    </div>
                    <div className="h-[6px] w-full bg-[#f5f5f7] dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: agent.conv }} className={cn("h-full rounded-full", agent.color === 'bg-teal-500' ? "bg-blue-500" : "bg-green-500")} />
                    </div>
                  </div>
                ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
