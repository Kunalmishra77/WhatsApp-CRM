import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, MessageSquare, Zap } from 'lucide-react';
import { Button } from '../../ui/Button';
import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { EmptyState } from '../../ui/EmptyState';

const LeadDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-zinc-500">
          <ChevronLeft size={16} className="mr-1" /> Back to Explorer
        </Button>
      </div>

      <PageHeader 
        title={`Lead Detail`} 
        subtitle={`Deep-dive intelligence for entity ID: ${id}`}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(`/conversations?phone=${id}`)} className="rounded-2xl px-6">
            <MessageSquare size={14} className="mr-2" /> View Chat
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SectionCard title="Identity Profile" subtitle="Base entity information." className="lg:col-span-1">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-24 h-24 rounded-[2.5rem] bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 border border-teal-500/20 shadow-xl shadow-teal-500/5">
              <User size={48} />
            </div>
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 italic uppercase">Loading Entity...</h4>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">ID: {id}</p>
          </div>
        </SectionCard>

        <SectionCard title="Behavioral Insights" subtitle="AI-synthesized interaction patterns." className="lg:col-span-2">
          <EmptyState 
            icon={Zap}
            title="Intelligence pending"
            description="Synthesis for this specific entity is being prepared. Real-time signals will appear here once processed."
            ctaText="Trigger Manual Sync"
            onCtaClick={() => {}}
          />
        </SectionCard>
      </div>
    </div>
  );
};

export default LeadDetailPage;
