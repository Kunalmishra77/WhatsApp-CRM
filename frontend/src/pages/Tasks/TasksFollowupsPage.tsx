import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ListTodo, 
  Plus, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  User, 
  Phone, 
  ArrowRight, 
  MessageSquare, 
  Filter,
  MoreVertical,
  Loader2,
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { EmptyState } from '../../ui/EmptyState';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Skeleton } from '../../ui/Skeleton';
import { Card } from '../../ui/Card';
import { Modal } from '../../ui/Modal';
import { FixedDropdown } from '../../ui/FixedDropdown';
import { RangeControl } from '../../components/Range/RangeControl';
import { useRange } from '../../state/globalRangeStore';
import { dataApi, type LeadTask } from '../../data/api';
import { cn } from '../../lib/utils';

const TASK_TYPES = [
  { value: 'Follow-up Call', label: 'Follow-up Call' },
  { value: 'WhatsApp Message', label: 'WhatsApp Message' },
  { value: 'Price Quote', label: 'Send Price Quote' },
  { value: 'Site Visit', label: 'Site Visit' },
  { value: 'Contract Signing', label: 'Contract Signing' },
  { value: 'Other', label: 'Other' },
];

const TasksFollowupsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { from, to, preset } = useRange();
  const range = { from, to };

  // --- State ---
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    type: 'Follow-up Call',
    due_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  // --- Queries ---
  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['lead-tasks', preset, from, to],
    queryFn: () => dataApi.fetchTasks(range),
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (filter === 'all') return tasks;
    return tasks.filter(t => filter === 'done' ? t.done : !t.done);
  }, [tasks, filter]);

  const stats = useMemo(() => {
    if (!tasks) return { pending: 0, overdue: 0, completed: 0 };
    const now = new Date();
    return {
      pending: tasks.filter(t => !t.done).length,
      overdue: tasks.filter(t => !t.done && isBefore(parseISO(t.due_at), now)).length,
      completed: tasks.filter(t => t.done).length
    };
  }, [tasks]);

  // --- Mutations ---
  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<LeadTask>) => dataApi.createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks'] });
      toast.success("Task forged successfully.");
      setIsModalOpen(false);
      setForm({ phone: '', type: 'Follow-up Call', due_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), notes: '' });
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, done }: { id: string, done: boolean }) => dataApi.toggleTaskDone(id, done),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks'] });
      toast.success("Task status synchronized.");
    }
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || !form.notes) {
      toast.error("Required fields missing.");
      return;
    }
    createTaskMutation.mutate({
      phone_number: form.phone,
      task_type: form.type,
      due_at: new Date(form.due_at).toISOString(),
      notes: form.notes,
      created_by: 'Agent',
      done: false
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader 
        title="Tasks & Follow-ups" 
        subtitle="Operational workflow and scheduled lead interactions."
        actions={
          <>
            <RangeControl />
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="rounded-2xl px-6">
              <Plus size={14} className="mr-2" /> New Task
            </Button>
          </>
        }
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white dark:bg-white/[0.02] flex items-center gap-4 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pending Items</p>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{stats.pending}</h4>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-white/[0.02] flex items-center gap-4 border border-rose-200 dark:border-rose-500/10 shadow-sm dark:shadow-none">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500"><AlertCircle size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Overdue</p>
            <h4 className="text-2xl font-black text-rose-500 tabular-nums">{stats.overdue}</h4>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-white/[0.02] flex items-center gap-4 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Completed</p>
            <h4 className="text-2xl font-black text-emerald-500 tabular-nums">{stats.completed}</h4>
          </div>
        </Card>
      </div>
      
      <SectionCard 
        title="Workflow Queue" 
        subtitle="Priority items requiring immediate attention."
        headerActions={
          <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200/50 dark:border-white/10">
            <button 
              onClick={() => setFilter('pending')}
              className={cn("px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", filter === 'pending' ? "bg-white dark:bg-zinc-800 text-teal-500 shadow-sm" : "text-zinc-500")}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('done')}
              className={cn("px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", filter === 'done' ? "bg-white dark:bg-zinc-800 text-teal-500 shadow-sm" : "text-zinc-500")}
            >
              Done
            </button>
            <button 
              onClick={() => setFilter('all')}
              className={cn("px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", filter === 'all' ? "bg-white dark:bg-zinc-800 text-teal-500 shadow-sm" : "text-zinc-500")}
            >
              All
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
          ) : filteredTasks.length === 0 ? (
            <EmptyState 
              icon={ListTodo}
              title="No tasks found"
              description="Your priority queue is clear for this range. Use the 'New Task' button to schedule interactions."
              ctaText="Create First Task"
              onCtaClick={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "group flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none transition-all relative overflow-hidden",
                    task.done ? "opacity-60 grayscale" : "hover:border-teal-500/30"
                  )}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <button 
                      onClick={() => toggleTaskMutation.mutate({ id: task.id, done: task.done })}
                      className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border",
                        task.done 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-300 hover:border-teal-500 hover:text-teal-500"
                      )}
                    >
                      {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <Badge variant="zinc" className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-none text-[8px] uppercase tracking-widest">{task.task_type}</Badge>
                        <span className={cn("text-[10px] font-black uppercase tracking-tighter flex items-center gap-1", isBefore(parseISO(task.due_at), new Date()) && !task.done ? "text-rose-500" : "text-zinc-400")}>
                          <Clock size={12} />
                          {format(parseISO(task.due_at), 'dd MMM • hh:mm a')}
                        </span>
                      </div>
                      <h4 className={cn("text-sm font-black mt-1", task.done ? "line-through text-zinc-500" : "text-zinc-900 dark:text-zinc-100")}>
                        {task.notes}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="flex items-center gap-1.5">
                            <User size={12} className="text-zinc-400" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{task.lead_name}</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-zinc-400" />
                            <span className="text-[10px] font-bold text-zinc-500">{task.phone_number}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/conversations?phone=${task.phone_number}`)}
                      className="rounded-xl h-10 w-10 p-0 text-zinc-400 hover:text-teal-500"
                    >
                      <MessageSquare size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/leads?search=${task.phone_number}`)}
                      className="rounded-xl h-10 w-10 p-0 text-zinc-400 hover:text-teal-500"
                    >
                      <ArrowRight size={18} />
                    </Button>
                  </div>

                  {/* Dynamic side bar */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-all",
                    task.done ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : isBefore(parseISO(task.due_at), new Date()) ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" : "bg-teal-500 shadow-[0_0_10px_#14b8a6]"
                  )} />
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Task Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Forge New Task"
        overflowHidden={false}
      >
        <form onSubmit={handleCreateTask} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Lead Phone Number</label>
              <input 
                type="text" 
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 919289..."
                className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Task Category</label>
              <FixedDropdown 
                options={TASK_TYPES}
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Due Date & Time</label>
              <input 
                type="datetime-local" 
                value={form.due_at}
                onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Instruction / Notes</label>
              <textarea 
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Details of the interaction..."
                className="w-full h-32 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" variant="primary" className="w-full py-4 rounded-2xl" loading={createTaskMutation.isPending}>
              <Save size={18} className="mr-2" /> Forge Task
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

export default TasksFollowupsPage;
