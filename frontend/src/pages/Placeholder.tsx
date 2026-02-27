import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Construction } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { toast } from 'sonner';

const Page: React.FC<{ name: string; subtitle?: string }> = ({ 
  name, 
  subtitle = "Synthesizing real-time data intelligence." 
}) => {
  const handleAction = () => {
    toast.info(`Initialising ${name} workspace...`, {
      description: "AI Agent is preparing the environment.",
      position: "bottom-center"
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-zinc-100">
            {name.split(' ')[0]} <span className="font-light text-zinc-500">{name.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        <Button variant="primary" size="md" onClick={handleAction} className="rounded-2xl px-8 shadow-teal-500/20">
          <Plus size={18} className="mr-2" /> New Activity
        </Button>
      </div>

      {/* Coming Next Empty State Card */}
      <Card className="min-h-[500px] flex items-center justify-center border-dashed border-2 border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
        <div className="text-center max-w-md px-6">
          <motion.div 
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="w-20 h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center text-teal-500 mx-auto mb-8 shadow-[0_0_40px_rgba(20,184,166,0.1)]"
          >
            <Construction size={40} strokeWidth={1.5} />
          </motion.div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase italic mb-3">Module Under Construction</h3>
          <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-8">
            Our AI agents are currently mapping this interface. Advanced data synthesis and real-time visualization for <span className="text-teal-500 font-bold">{name}</span> will be available in the next release.
          </p>
          <div className="flex items-center justify-center gap-3">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                ))}
             </div>
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">3 Agents Active</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Page;
