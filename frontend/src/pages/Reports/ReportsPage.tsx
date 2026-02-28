import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieIcon,
  Activity,
  Loader2
} from 'lucide-react';
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
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';

import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { FixedDropdown } from '../../ui/FixedDropdown';
import { RangeControl } from '../../components/Range/RangeControl';
import { useRange } from '../../state/globalRangeStore';
import { dataApi, type ReportsData } from '../../data/api';
import { cn } from '../../lib/utils';

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = React.useState('conversion');
  const { from, to, preset } = useRange();
  const range = { from, to };

  const { data, isLoading } = useQuery<ReportsData>({
    queryKey: ['reports-data', preset, from, to],
    queryFn: () => dataApi.fetchReportsData(range),
  });

  const handleRequestReport = () => {
    toast.success(`Synthesizing comprehensive ${reportType} report...`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Performance Reports" 
        subtitle="Deep analytics and operational efficiency metrics."
        actions={
          <div className="flex items-center gap-2">
            <RangeControl />
            <FixedDropdown 
              options={[
                { value: 'conversion', label: 'Conversion Rates' },
                { value: 'sentiment', label: 'Sentiment Trends' },
                { value: 'ops', label: 'Operational Speed' },
                { value: 'whatsapp', label: 'WhatsApp Engagement' },
              ]}
              value={reportType}
              onChange={setReportType}
              className="w-48"
            />
            <Button variant="primary" size="sm" onClick={handleRequestReport}>
              <FileText size={14} className="mr-2" /> Request PDF
            </Button>
          </div>
        }
      />

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(data?.engagementMetrics || Array.from({ length: 4 })).map((m: any, i) => (
          <Card key={i} className="p-6 bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-20 bg-zinc-100 dark:bg-white/5 animate-pulse rounded" />
                <div className="h-8 w-24 bg-zinc-100 dark:bg-white/5 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-tight">{m.label}</span>
                  <div className={cn("flex items-center text-[9px] font-bold", m.isUp ? "text-green-500" : "text-red-500")}>
                    {m.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {m.delta}
                  </div>
                </div>
                <h4 className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">{m.value}</h4>
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversion Ratio */}
        <Card className="p-8 h-[450px] bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm flex flex-col">
          <div className="mb-8 shrink-0">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Target size={18} className="text-blue-500" /> Lead Lifecycle
            </h3>
            <p className="text-[11px] font-medium text-zinc-400 mt-1">Final decision distribution across the pipeline.</p>
          </div>
          
          <div className="flex-1 relative min-h-0">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.conversionRatio || []}
                      innerRadius="65%"
                      outerRadius="85%"
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#007aff" />
                      <Cell fill="#ff3b30" />
                      <Cell fill="#8e8e93" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: '600' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="p-8 h-[450px] bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm flex flex-col">
          <div className="mb-8 shrink-0">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-500" /> Market Sentiment
            </h3>
            <p className="text-[11px] font-medium text-zinc-400 mt-1">Aggregated emotional signals from conversations.</p>
          </div>
          
          <div className="flex-1 relative min-h-0">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.sentimentSplit || []} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600', fill: '#8e8e93' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {(data?.sentimentSplit || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color === '#10b981' ? '#34c759' : entry.color === '#f43f5e' ? '#ff3b30' : '#8e8e93'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card className="p-8 h-[450px] bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 shadow-sm flex flex-col">
        <div className="mb-8 shrink-0">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" /> Performance Velocity
          </h3>
          <p className="text-[11px] font-medium text-zinc-400 mt-1">Daily signal processing vs conversion success trend.</p>
        </div>
        
        <div className="flex-1 relative min-h-0">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : (
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.performanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSignals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007aff" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600', fill: '#8e8e93' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600', fill: '#8e8e93' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="signals" stroke="#007aff" strokeWidth={3} fillOpacity={1} fill="url(#colorSignals)" name="Total Signals" />
                  <Area type="monotone" dataKey="conversions" stroke="#34c759" strokeWidth={3} fill="transparent" name="Conversions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
