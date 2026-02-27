import React, { useState } from 'react';
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
  MoreVertical,
  Download,
  Filter,
  Calendar,
  MousePointer2,
  Plus,
  Send,
  Save,
  Loader2
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { toast } from 'sonner';
import { 
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
import { useDashboardRange } from '../../state/dashboardRangeStore';
import { getLabelForRange, DatePreset } from '../../utils/dateRange';
import { useQuery } from '@tanstack/react-query';
import { dataApi, KPIStats, TrendPoint, StagePoint, FollowUpLead } from '../../data/api';

const DashboardPage: React.FC = () => {
  const { preset, range, setPreset, setCustomRange } = useDashboardRange();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customDates, setCustomDates] = useState({ from: range.from, to: range.to });

  // Data Queries
  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIStats>({
    queryKey: ['dashboard-kpis', range],
    queryFn: () => dataApi.fetchDashboardKPIs(range),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery<TrendPoint[]>({
    queryKey: ['dashboard-trend', range, preset],
    queryFn: () => dataApi.fetchLeadsTrend(range, preset),
  });

  const { data: stageDistro, isLoading: stageLoading } = useQuery<StagePoint[]>({
    queryKey: ['dashboard-stage', range],
    queryFn: () => dataApi.fetchStageDistribution(range),
  });

  const { data: followUps, isLoading: followUpsLoading } = useQuery<FollowUpLead[]>({
    queryKey: ['dashboard-followups', range],
    queryFn: () => dataApi.fetchTopFollowUps(range),
  });

  const { data: funnelData } = useQuery({
    queryKey: ['dashboard-funnel', range],
    queryFn: () => dataApi.fetchFunnel(range),
  });

  const { data: agentPerformance } = useQuery({
    queryKey: ['dashboard-agents', range],
    queryFn: () => dataApi.fetchAgentPerformance(range),
  });

  const handlePresetChange = (newPreset: string) => {
    if (newPreset === 'Custom') {
      setIsModalOpen(true);
    } else {
      const p = newPreset.toLowerCase() as DatePreset;
      setPreset(p);
      toast.success(`Range updated`, {
        description: getLabelForRange(p, range),
        position: 'top-right'
      });
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomRange(customDates.from, customDates.to);
    setIsModalOpen(false);
    toast.success(`Custom range applied`, {
      description: `${customDates.from} to ${customDates.to}`,
      position: 'top-right'
    });
  };

  const handleComingSoon = () => {
    toast.info("Coming next: Deep intelligence drilldown.");
  };

  const kpiCards = [
    { title: 'Total Leads', value: kpis?.totalLeads ?? '0', change: '+12.5%', isUp: true, icon: Users, color: 'teal' },
    { title: 'Hot Leads', value: kpis?.hotLeads ?? '0', change: '+8.2%', isUp: true, icon: Flame, color: 'danger' },
    { title: 'Warm Leads', value: kpis?.warmLeads ?? '0', change: '-2.4%', isUp: false, icon: Zap, color: 'warning' },
    { title: 'Cold Leads', value: kpis?.coldLeads ?? '0', change: '+1.5%', isUp: true, icon: IceCream, color: 'info' },
    { title: 'Converted', value: kpis?.converted ?? '0', change: '+18.3%', isUp: true, icon: CheckCircle2, color: 'success' },
    { title: 'Unconverted', value: kpis?.unconverted ?? '0', change: '+4.1%', isUp: true, icon: XCircle, color: 'zinc' },
    { title: 'Avg Score', value: kpis?.avgScore ?? '0', change: '+5.2%', isUp: true, icon: TrendingUp, color: 'teal' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-zinc-100">
            Command <span className="font-light text-zinc-500">Center</span>
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Real-time revenue intelligence & operations.</p>
             <Badge variant="teal" className="bg-teal-500/5 dark:bg-teal-500/10 border-teal-500/20">
                <Calendar size={10} className="mr-1" /> {getLabelForRange(preset, range)}
             </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={handleComingSoon} className="rounded-2xl border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50">
              <Filter size={14} className="mr-2" /> Filter
           </Button>
           <Button variant="outline" size="sm" onClick={handleComingSoon} className="rounded-2xl border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50">
              <Download size={14} className="mr-2" /> Export
           </Button>
           <Button variant="primary" size="sm" onClick={handleComingSoon} className="rounded-2xl px-6">
              <Plus size={14} className="mr-2" /> New Campaign
           </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div 
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={handleComingSoon}
            className="cursor-pointer"
          >
            <Card className="p-5 group hover:border-teal-500/50 dark:hover:border-teal-500/30 transition-all duration-500 hover:scale-[1.02]">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-2 rounded-xl border shadow-sm transition-transform group-hover:scale-110",
                  kpi.color === 'teal' ? "bg-teal-500/10 text-teal-600 border-teal-500/20" :
                  kpi.color === 'danger' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                  kpi.color === 'warning' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                  kpi.color === 'info' ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
                  kpi.color === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                  "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
                )}>
                  <kpi.icon size={18} strokeWidth={2.5} />
                </div>
                <div className={cn(
                  "flex items-center text-[10px] font-black",
                  kpi.isUp ? "text-emerald-500" : "text-rose-500"
                )}>
                  {kpi.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kpi.change}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{kpi.title}</h3>
                {kpisLoading ? (
                  <div className="h-8 w-16 bg-zinc-100 dark:bg-white/5 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tighter">{kpi.value}</p>
                )}
              </div>
              <div className="mt-4 h-1 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                 <div className={cn("h-full rounded-full", 
                   kpi.color === 'teal' ? "bg-teal-500" :
                   kpi.color === 'danger' ? "bg-rose-500" :
                   kpi.color === 'warning' ? "bg-amber-500" :
                   kpi.color === 'info' ? "bg-sky-500" :
                   kpi.color === 'success' ? "bg-emerald-500" :
                   "bg-zinc-500"
                 )} style={{ width: '60%' }} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leads Trend */}
        <Card className="lg:col-span-2 p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter flex items-center gap-2 italic uppercase">
                <TrendingUp size={20} className="text-teal-500" /> Leads Trend
              </h3>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Growth signals across journey stages.</p>
            </div>
            <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200/50 dark:border-white/10 overflow-x-auto no-scrollbar">
              {['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handlePresetChange(tab)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                    (preset === tab.toLowerCase() || (tab === 'Custom' && preset === 'custom')) 
                      ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[350px] w-full relative">
            {trendLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-[2rem]">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWarm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717a' }} 
                  dy={10} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717a' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#fff', marginBottom: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area type="monotone" dataKey="hot" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorHot)" />
                <Area type="monotone" dataKey="warm" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorWarm)" />
                <Area type="monotone" dataKey="converted" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorTeal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stage Distribution */}
        <Card className="p-8 flex flex-col relative">
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase mb-1">Stage Split</h3>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-10">Lead distribution by journey stage.</p>
          
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {stageLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stageDistro || []}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  onClick={handleComingSoon}
                  stroke="none"
                >
                  {(stageDistro || []).map((entry: StagePoint, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tighter">
                 {kpis?.totalLeads ?? '0'}
               </span>
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Total Synthesized</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8">
            {(stageDistro || []).map((item: StagePoint) => (
              <div 
                key={item.name} 
                onClick={handleComingSoon}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 cursor-pointer hover:scale-[1.05] transition-transform"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter leading-none">{item.name}</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Top Follow-ups */}
        <Card className="lg:col-span-4 p-8 relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic">Priority Queue</h3>
            <Button variant="ghost" size="sm" onClick={handleComingSoon} className="h-8 w-8 p-0 rounded-lg"><MoreVertical size={16} /></Button>
          </div>
          {followUpsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-[2rem]">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          )}
          <div className="space-y-4">
            {(followUps || []).map((item: FollowUpLead, i: number) => (
              <div 
                key={i} 
                onClick={handleComingSoon}
                className="flex items-center justify-between p-4 rounded-[1.5rem] bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 hover:border-teal-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center font-bold text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                    {item.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                    <p className="text-[10px] font-semibold text-zinc-500">{item.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={item.status === 'Hot' ? 'danger' : 'warning'} className="mb-1">
                    {item.status}
                  </Badge>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6 rounded-2xl py-6 border-dashed text-xs uppercase tracking-widest font-black" onClick={handleComingSoon}>
             View Full Queue
          </Button>
        </Card>

        {/* Funnel & Performance */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="p-8">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic mb-8 text-center">Conversion Funnel</h3>
            <div className="flex items-center justify-between gap-2">
              {(funnelData || []).map((step: any, i: number) => (
                <React.Fragment key={step.label}>
                  <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer group" onClick={handleComingSoon}>
                    <div className={cn("w-full h-12 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-105 transition-transform", step.color)}>
                      {step.val}
                    </div>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{step.label}</span>
                  </div>
                  {i < (funnelData?.length || 0) - 1 && <div className="w-4 h-px bg-zinc-200 dark:bg-white/10 mt-[-18px]" />}
                </React.Fragment>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic mb-8">Agent Performance</h3>
            <div className="space-y-6">
              {(agentPerformance || []).map((agent: any) => (
                <div key={agent.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{agent.name}</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{agent.leads} Leads / {agent.conv} Conv</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", agent.color)} style={{ width: agent.conv === '15%' ? '70%' : agent.conv === '12%' ? '55%' : '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="lg:col-span-3 p-8">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic mb-8">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Export Leads', icon: Download, variant: 'outline' },
              { label: 'Bulk Update', icon: Zap, variant: 'outline' },
              { label: 'Create Task', icon: Plus, variant: 'outline' },
              { label: 'Send Broadcast', icon: Send, variant: 'primary' },
            ].map((action) => (
              <Button 
                key={action.label} 
                variant={action.variant as any} 
                className="w-full justify-start py-6 rounded-[1.5rem] border-zinc-200/50 dark:border-white/5"
                onClick={handleComingSoon}
              >
                <action.icon size={18} className="mr-3" />
                <span className="text-xs font-black uppercase tracking-widest">{action.label}</span>
              </Button>
            ))}
          </div>
          
          <div className="mt-10 p-6 rounded-[2rem] bg-gradient-to-br from-teal-500 to-emerald-600 text-white relative overflow-hidden group cursor-pointer" onClick={handleComingSoon}>
             <div className="relative z-10">
                <h4 className="font-black text-lg leading-tight italic uppercase">AI Growth <br/>Assistant</h4>
                <p className="text-[10px] font-bold opacity-80 mt-2 uppercase tracking-widest flex items-center gap-2">
                   Launch Optimizer <MousePointer2 size={12} />
                </p>
             </div>
             <Zap size={80} className="absolute top-[-10px] right-[-20px] text-white/10 group-hover:scale-110 transition-transform duration-500" fill="currentColor" strokeWidth={0} />
          </div>
        </Card>

      </div>

      {/* Custom Range Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Custom Analytics Range"
      >
        <form onSubmit={handleApplyCustom} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">From Date</label>
              <input 
                type="date" 
                value={customDates.from}
                onChange={(e) => setCustomDates(prev => ({ ...prev, from: e.target.value }))}
                className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">To Date</label>
              <input 
                type="date" 
                value={customDates.to}
                onChange={(e) => setCustomDates(prev => ({ ...prev, to: e.target.value }))}
                className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" variant="primary" className="w-full py-4 rounded-2xl">
              <Save size={18} className="mr-2" /> Apply Range
            </Button>
            <Button type="button" variant="ghost" className="w-full text-zinc-500" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
