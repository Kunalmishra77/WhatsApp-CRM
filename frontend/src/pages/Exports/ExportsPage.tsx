import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Download, 
  FileDown, 
  History, 
  Database, 
  ShieldCheck, 
  Clock, 
  User, 
  ArrowRight,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { EmptyState } from '../../ui/EmptyState';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Skeleton } from '../../ui/Skeleton';
import { FixedDropdown } from '../../ui/FixedDropdown';
import { RangeControl } from '../../components/Range/RangeControl';
import { useRange } from '../../state/globalRangeStore';
import { dataApi, type ExportHistoryItem } from '../../data/api';
import { cn } from '../../lib/utils';

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV SpreadSheet' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'json', label: 'Raw JSON Data' },
];

const ExportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { from, to, preset } = useRange();
  const range = { from, to };
  const [formatType, setFormatType] = React.useState('csv');

  // --- Queries ---
  const { data: history, isLoading: historyLoading } = useQuery<ExportHistoryItem[]>({
    queryKey: ['export-history', preset, from, to],
    queryFn: () => dataApi.fetchExportHistory(range),
  });

  const handleExport = async () => {
    toast.loading(`Extracting data for range: ${from} to ${to}...`);
    
    try {
      // 1. Fetch data specifically for export
      const leads = await dataApi.fetchLeads({ range });
      
      if (!leads || leads.length === 0) {
        toast.dismiss();
        toast.error("Extraction failed: No data found in selected range.");
        return;
      }

      if (formatType === 'csv') {
        const headers = ["Name", "Phone", "Bucket", "Score", "Sentiment", "Status", "Concern", "Summary", "Next Action", "Created At"];
        const csvContent = [
          headers.join(","),
          ...leads.map(l => [
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
        link.setAttribute("download", `IndiaGrain_Intelligence_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.info(`Format ${formatType.toUpperCase()} is currently in synthesis. Please use CSV for now.`);
        toast.dismiss();
        return;
      }

      // 2. Log the action
      await dataApi.logExportAction(formatType, leads.length, range);
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      
      toast.dismiss();
      toast.success("Extraction successful", { description: `${leads.length} entities extracted.` });
    } catch (e) {
      toast.dismiss();
      toast.error("Critical error during data extraction.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader 
        title="Data Exports" 
        subtitle="Secure extraction of CRM intelligence and interaction logs."
        actions={<RangeControl />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[500px] items-stretch">
        {/* Left: Export Action Card */}
        <Card className="lg:col-span-7 p-8 flex flex-col justify-between h-full bg-white/40 dark:bg-[#09090b]/40 border-zinc-200/50 dark:border-white/[0.03] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase flex items-center gap-2">
                <Database size={20} className="text-teal-500" /> Intelligence Export
              </h3>
              <Badge variant="teal" className="bg-teal-500/10 text-teal-500 border-none px-3 py-1">SECURE_LINK_ACTIVE</Badge>
            </div>

            <div className="space-y-8 max-w-md">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] pl-1">Target Extraction Format</label>
                <FixedDropdown 
                  options={EXPORT_FORMATS}
                  value={formatType}
                  onChange={setFormatType}
                  className="w-full"
                />
              </div>

              <div className="p-6 rounded-3xl bg-zinc-100/50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1"><ShieldCheck size={18} className="text-teal-500" /></div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Encrypted Handshake</p>
                    <p className="text-[10px] font-medium text-zinc-500 leading-relaxed mt-1">
                      Data extraction includes lead metadata, AI synthesis, and sentiment history. PII is handled per operational guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 relative z-10">
            <Button variant="primary" className="w-full py-8 rounded-[2rem] shadow-xl shadow-teal-500/20" onClick={handleExport}>
              <Download size={20} className="mr-3" />
              <span className="text-sm font-black uppercase tracking-[0.2em]">Initiate Extraction</span>
            </Button>
          </div>

          {/* Background Decoration */}
          <FileDown size={180} className="absolute right-[-40px] bottom-[-40px] text-teal-500/[0.03] pointer-events-none" />
        </Card>

        {/* Right: History Audit Trail */}
        <SectionCard 
          title="Audit Trail" 
          subtitle="Recent extraction activities."
          className="lg:col-span-5 h-full flex flex-col overflow-hidden"
          overflowHidden={true}
        >
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 min-h-0">
            {historyLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : !history || history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <History size={40} />
                <p className="text-[10px] font-black uppercase mt-4">No History</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-teal-500 transition-colors">
                      {item.payload.format === 'csv' ? <FileSpreadsheet size={18} /> : <FileJson size={18} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                        Extraction: {item.payload.format.toUpperCase()}
                      </h4>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                        {item.payload.count} Entities • {format(parseISO(item.created_at), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 size={14} className="text-emerald-500 opacity-50" />
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-zinc-200/50 dark:border-white/5 text-center shrink-0">
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">End of Audit Trail</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default ExportsPage;
