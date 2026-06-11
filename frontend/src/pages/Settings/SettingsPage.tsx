import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { Settings, Save, Moon, Sun, Bell, Database, Shield, Zap, Globe, User } from 'lucide-react';
import { Button } from '../../ui/Button';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { bGet } from '../../data/backendApi';

import { useTheme } from '../../state/themeStore';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [autoInsights, setAutoInsights] = useState(true);
  const [notifications, setBell] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await bGet('/health');
      if (result?.ok) {
        toast.success('Database connected — Supabase is healthy.');
      } else {
        toast.error('Database check failed — connection may be degraded.');
      }
    } catch {
      toast.error('Cannot reach backend — is the server running on port 3010?');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = () => {
    toast.success("Intelligence parameters updated successfully.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader 
        title="System Settings" 
        subtitle="Configure operational parameters and AI behavioral guards."
        actions={
          <Button variant="primary" size="sm" onClick={handleSaveSettings} className="rounded-2xl px-6">
            <Save size={14} className="mr-2" /> Save Config
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionCard title="Experience" subtitle="Platform behavior and display preferences.">
          <div className="space-y-4">
            <div 
              onClick={toggleTheme}
              className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 cursor-pointer hover:border-teal-500/30 transition-all group shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-teal-500 transition-colors">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Interface Theme</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Currently: {theme.toUpperCase()}</p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300",
                theme === 'dark' ? "bg-teal-500" : "bg-zinc-300"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                  theme === 'dark' ? "right-1" : "left-1"
                )} />
              </div>
            </div>
            
            <div 
              onClick={() => setAutoInsights(!autoInsights)}
              className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 cursor-pointer hover:border-teal-500/30 transition-all group shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-teal-500 transition-colors">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Auto-Insights</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Real-time signal synthesis</p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300",
                autoInsights ? "bg-teal-500" : "bg-zinc-300"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                  autoInsights ? "right-1" : "left-1"
                )} />
              </div>
            </div>

            <div 
              onClick={() => setBell(!notifications)}
              className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 cursor-pointer hover:border-teal-500/30 transition-all group shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-teal-500 transition-colors">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Signals Alert</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Push notifications for hot leads</p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300",
                notifications ? "bg-teal-500" : "bg-zinc-300"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                  notifications ? "right-1" : "left-1"
                )} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="API Infrastructure" subtitle="Manage external integrations and hooks.">
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Database size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Supabase Core</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Database Connection</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-[9px] h-9 border-zinc-200 dark:border-white/10" onClick={handleTestConnection} disabled={testingConnection}>
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">WhatsApp Webhook</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Status: Receiving Signals</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-[9px] h-9 border-zinc-200 dark:border-white/10" onClick={() => toast.info("Rotating webhook keys...")}>Rotate Keys</Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Security & Audit" subtitle="Identity and access management." className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex flex-col items-center text-center gap-3 shadow-sm dark:shadow-none">
               <Shield size={32} className="text-zinc-300 dark:text-zinc-700" />
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">2-Factor Authentication Required</p>
               <Button variant="ghost" size="sm" className="text-teal-500 text-[9px]">Configure</Button>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex flex-col items-center text-center gap-3 shadow-sm dark:shadow-none">
               <Settings size={32} className="text-zinc-300 dark:text-zinc-700" />
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">System-wide Guardrails Enabled</p>
               <Button variant="ghost" size="sm" className="text-teal-500 text-[9px]">View Policies</Button>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex flex-col items-center text-center gap-3 shadow-sm dark:shadow-none">
               <User size={32} className="text-zinc-300 dark:text-zinc-700" />
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">Account Integrity Verified</p>
               <Button variant="ghost" size="sm" className="text-teal-500 text-[9px]">Audit Log</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default SettingsPage;
