import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  MessageSquare,
  ClipboardList,
  StickyNote,
  CheckSquare,
  Square,
  Plus,
  X,
  Tag,
  User,
  Phone,
  Stethoscope,
  Brain,
  ArrowRight,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { SectionCard } from '../../ui/SectionCard';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { cn } from '../../lib/utils';
import { bGet, bPost, bPatch, bDelete } from '../../data/backendApi';

type Tab = 'conversations' | 'tasks' | 'notes';

const TASK_TYPES = ['Call', 'Follow-up', 'Visit', 'Other'];

const getSentimentVariant = (s: string): 'success' | 'danger' | 'zinc' => {
  if (!s) return 'zinc';
  const l = s.toLowerCase();
  if (l.includes('pos')) return 'success';
  if (l.includes('neg')) return 'danger';
  return 'zinc';
};

const getStageVariant = (stage: string): 'danger' | 'warning' | 'teal' | 'zinc' => {
  if (!stage) return 'zinc';
  const l = stage.toLowerCase();
  if (l.includes('hot')) return 'danger';
  if (l.includes('warm')) return 'warning';
  if (l.includes('average') || l.includes('avg')) return 'teal';
  if (l.includes('cold')) return 'info' as any;
  return 'zinc';
};

const formatTs = (ts: string) => {
  try { return format(parseISO(ts), 'dd MMM yyyy, hh:mm a'); }
  catch { return ts; }
};

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('conversations');
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [newTagInput, setNewTagInput] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [taskForm, setTaskForm] = useState({ open: false, type: 'Call', notes: '', due_at: '' });

  const leadQuery = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const rows = await bGet('/proxy/insights/by-ids', { ids: id });
      if (!rows || rows.length === 0) throw new Error('Lead not found');
      return rows[0];
    },
    enabled: !!id,
  });

  const lead = leadQuery.data;
  const phone: string = lead?.['Phone Number'] ?? '';

  const convsQuery = useQuery({
    queryKey: ['lead-convs', phone],
    queryFn: async () => {
      const rows = await bGet('/proxy/conversations/range', { from: '2020-01-01', to: '2099-12-31' });
      return (rows as any[]).filter((r) => r['Phone Number'] === phone);
    },
    enabled: !!phone,
  });

  const tasksQuery = useQuery({
    queryKey: ['lead-tasks', phone],
    queryFn: async () => {
      const rows = await bGet('/proxy/tasks');
      return (rows as any[]).filter((r) => r.phone_number === phone);
    },
    enabled: !!phone,
  });

  const notesQuery = useQuery({
    queryKey: ['lead-notes', phone],
    queryFn: () => bGet('/notes/' + encodeURIComponent(phone)),
    enabled: !!phone,
  });

  const tagsQuery = useQuery({
    queryKey: ['lead-tags', phone],
    queryFn: () => bGet('/tags/' + encodeURIComponent(phone)),
    enabled: !!phone,
  });

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => bPost('/tags', { phone, tag }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead-tags', phone] }); setNewTagInput(''); },
    onError: (e: any) => toast.error(e.message || 'Failed to add tag'),
  });

  const removeTagMutation = useMutation({
    mutationFn: (tag: string) => bDelete('/tags', { phone, tag }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-tags', phone] }),
    onError: (e: any) => toast.error(e.message || 'Failed to remove tag'),
  });

  const addNoteMutation = useMutation({
    mutationFn: (note_text: string) => bPost('/notes', { phone_number: phone, note_text, created_by: 'Agent' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead-notes', phone] }); setNewNoteText(''); toast.success('Note saved'); },
    onError: (e: any) => toast.error(e.message || 'Failed to save note'),
  });

  const addTaskMutation = useMutation({
    mutationFn: (payload: any) => bPost('/proxy/tasks', { ...payload, phone_number: phone, created_by: 'Agent', done: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead-tasks', phone] }); setTaskForm({ open: false, type: 'Call', notes: '', due_at: '' }); toast.success('Task created'); },
    onError: (e: any) => toast.error(e.message || 'Failed to create task'),
  });

  const doneTaskMutation = useMutation({
    mutationFn: (taskId: string) => bPatch('/proxy/tasks/' + taskId, { done: true, done_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-tasks', phone] }),
    onError: (e: any) => toast.error(e.message || 'Failed to update task'),
  });

  const sessions = React.useMemo(() => {
    const convs: any[] = convsQuery.data ?? [];
    const map: Record<string, any[]> = {};
    convs.forEach((c) => {
      const key = c['Session ID'] ?? 'unknown';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return Object.entries(map).sort((a, b) => {
      const ta = a[1][0]?.Timestamp ?? '';
      const tb = b[1][0]?.Timestamp ?? '';
      return tb.localeCompare(ta);
    });
  }, [convsQuery.data]);

  const toggleSession = (sid: string) =>
    setExpandedSessions((prev) => ({ ...prev, [sid]: !prev[sid] }));

  if (leadQuery.isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[600px] rounded-2xl lg:col-span-1" />
          <Skeleton className="h-[600px] rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (leadQuery.isError || !lead) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-zinc-500">
          <ChevronLeft size={16} className="mr-1" /> Back to Explorer
        </Button>
        <EmptyState icon={User} title="Lead not found" description="This patient lead could not be loaded. It may have been removed or the ID is invalid." ctaText="Back to Leads" onCtaClick={() => navigate('/leads')} />
      </div>
    );
  }

  const name: string = lead['User Name'] ?? 'Unknown Patient';
  const concern: string = lead['concern'] ?? '';
  const stage: string = lead['lead stage'] ?? '';
  const sentiment: string = lead['sentiment'] ?? '';
  const summary: string = lead['Conversation Summary'] ?? '';
  const action: string = lead['Action to be taken'] ?? '';
  const tags: any[] = tagsQuery.data ?? [];

  const tabClasses = (t: Tab) =>
    cn('px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all', activeTab === t ? 'bg-teal-500 text-white shadow' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-zinc-500">
          <ChevronLeft size={16} className="mr-1" /> Back to Explorer
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase italic">{name}</h1>
          <p className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-2">
            <Phone size={12} /> {phone}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate(`/conversations?phone=${encodeURIComponent(phone)}`)} className="rounded-2xl px-6">
          <MessageSquare size={14} className="mr-2" /> View Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <SectionCard title="Patient Profile" className="lg:col-span-1" overflowHidden={false}>
          <div className="flex flex-col items-center pt-2 pb-6 text-center border-b border-zinc-100 dark:border-white/5 mb-6">
            <div className="w-20 h-20 rounded-[2rem] bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 border border-teal-500/20 shadow-xl shadow-teal-500/5">
              <span className="text-3xl font-black">{name.charAt(0).toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 italic uppercase tracking-tight">{name}</h3>
            <p className="text-xs text-zinc-500 font-medium mt-1 flex items-center gap-1"><Phone size={10} />{phone}</p>
          </div>

          <div className="space-y-5">
            {concern && (
              <div className="flex gap-3 items-start">
                <Stethoscope size={15} className="text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Concern</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">{concern}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-start">
              <ArrowRight size={15} className="text-teal-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Lead Stage</p>
                <Badge variant={getStageVariant(stage)} size="sm">{stage || 'Unknown'}</Badge>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Brain size={15} className="text-teal-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Sentiment</p>
                <Badge variant={getSentimentVariant(sentiment)} size="sm">{sentiment || 'Unknown'}</Badge>
              </div>
            </div>

            {summary && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Conversation Summary</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-white/[0.03] rounded-xl p-3 border border-zinc-100 dark:border-white/5">{summary}</p>
              </div>
            )}

            {action && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Action to be Taken</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-amber-50 dark:bg-amber-500/5 rounded-xl p-3 border border-amber-100 dark:border-amber-500/10">{action}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5"><Tag size={10} />Tags</p>
              {tagsQuery.isLoading ? (
                <Skeleton className="h-6 w-full rounded-full" />
              ) : (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.length === 0 && <span className="text-xs text-zinc-400">No tags yet</span>}
                  {tags.map((t: any) => (
                    <span key={t.id ?? t.tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-semibold">
                      {t.tag}
                      <button onClick={() => removeTagMutation.mutate(t.tag)} className="ml-0.5 hover:text-rose-500 transition-colors" disabled={removeTagMutation.isPending}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newTagInput.trim()) addTagMutation.mutate(newTagInput.trim()); }}
                  placeholder="Add tag..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <Button variant="outline" size="sm" onClick={() => { if (newTagInput.trim()) addTagMutation.mutate(newTagInput.trim()); }} disabled={addTagMutation.isPending || !newTagInput.trim()} className="rounded-lg">
                  <Plus size={12} />
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Status Actions</p>
              <Button variant="primary" size="sm" className="w-full rounded-xl justify-center" onClick={() => toast.success('Marked as Converted')}>Mark Converted</Button>
              <Button variant="outline" size="sm" className="w-full rounded-xl justify-center" onClick={() => toast.info('Scheduled for Follow Up')}>Follow Up</Button>
              <Button variant="ghost" size="sm" className="w-full rounded-xl justify-center text-rose-500 hover:text-rose-600" onClick={() => toast.warning('Marked as Not Interested')}>Not Interested</Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          overflowHidden={false}
          headerActions={
            <div className="flex gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl">
              <button onClick={() => setActiveTab('conversations')} className={tabClasses('conversations')}><MessageSquare size={11} className="inline mr-1" />Conversations</button>
              <button onClick={() => setActiveTab('tasks')} className={tabClasses('tasks')}><ClipboardList size={11} className="inline mr-1" />Tasks</button>
              <button onClick={() => setActiveTab('notes')} className={tabClasses('notes')}><StickyNote size={11} className="inline mr-1" />Notes</button>
            </div>
          }
        >
          {activeTab === 'conversations' && (
            <div className="space-y-4 min-h-[300px]">
              {convsQuery.isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              )}
              {convsQuery.isError && <p className="text-sm text-rose-500 text-center py-8">Failed to load conversations</p>}
              {!convsQuery.isLoading && !convsQuery.isError && sessions.length === 0 && (
                <EmptyState icon={MessageSquare} title="No conversations" description="No WhatsApp conversations found for this patient yet." />
              )}
              {!convsQuery.isLoading && sessions.map(([sid, msgs]) => {
                const isOpen = expandedSessions[sid] !== false;
                const firstMsg = msgs[0];
                return (
                  <div key={sid} className="border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden">
                    <button onClick={() => toggleSession(sid)} className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors text-left">
                      <div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Session {sid.slice(-8)}</span>
                        <span className="text-[10px] text-zinc-400 ml-3">{msgs.length} message{msgs.length !== 1 ? 's' : ''}</span>
                        {firstMsg?.['Conversation Stage'] && <Badge variant="info" size="xs" className="ml-2">{firstMsg['Conversation Stage']}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {firstMsg?.Timestamp && <span className="text-[10px] text-zinc-400">{formatTs(firstMsg.Timestamp)}</span>}
                        <ChevronLeft size={14} className={cn('text-zinc-400 transition-transform', isOpen ? '-rotate-90' : 'rotate-180')} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-zinc-100 dark:divide-white/5">
                        {msgs.map((msg: any, i: number) => (
                          <div key={i} className="px-4 py-3 space-y-2">
                            {msg['User Message'] && (
                              <div className="flex gap-2 items-start">
                                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase mt-0.5 w-8 flex-shrink-0">User</span>
                                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">{msg['User Message']}</p>
                              </div>
                            )}
                            {msg['Bot Response'] && (
                              <div className="flex gap-2 items-start">
                                <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase mt-0.5 w-8 flex-shrink-0">Bot</span>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{msg['Bot Response']}</p>
                              </div>
                            )}
                            {msg.Timestamp && <p className="text-[10px] text-zinc-400 pl-10">{formatTs(msg.Timestamp)}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4 min-h-[300px]">
              {tasksQuery.isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              )}
              {tasksQuery.isError && <p className="text-sm text-rose-500 text-center py-8">Failed to load tasks</p>}
              {!tasksQuery.isLoading && !tasksQuery.isError && (tasksQuery.data ?? []).length === 0 && !taskForm.open && (
                <EmptyState icon={ClipboardList} title="No tasks" description="No tasks have been created for this patient yet." ctaText="Add Task" onCtaClick={() => setTaskForm((f) => ({ ...f, open: true }))} />
              )}
              {!tasksQuery.isLoading && (tasksQuery.data ?? []).map((task: any) => (
                <div key={task.id} className={cn('flex items-start gap-3 p-4 rounded-xl border transition-colors', task.done ? 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-100 dark:border-white/5 opacity-60' : 'bg-white dark:bg-white/[0.04] border-zinc-200 dark:border-white/10')}>
                  <button
                    onClick={() => !task.done && doneTaskMutation.mutate(task.id)}
                    disabled={task.done || doneTaskMutation.isPending}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {task.done ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} className="text-zinc-400 hover:text-teal-500 transition-colors" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-bold', task.done ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200')}>{task.task_type}</span>
                      {task.due_at && (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1"><CalendarClock size={10} />{formatTs(task.due_at)}</span>
                      )}
                    </div>
                    {task.notes && <p className="text-xs text-zinc-500 mt-1">{task.notes}</p>}
                  </div>
                </div>
              ))}
              {taskForm.open && (
                <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">New Task</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Type</label>
                      <select
                        value={taskForm.type}
                        onChange={(e) => setTaskForm((f) => ({ ...f, type: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      >
                        {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Due Date</label>
                      <input
                        type="datetime-local"
                        value={taskForm.due_at}
                        onChange={(e) => setTaskForm((f) => ({ ...f, due_at: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Notes</label>
                    <input
                      value={taskForm.notes}
                      onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Task notes..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setTaskForm({ open: false, type: 'Call', notes: '', due_at: '' })} className="rounded-lg">Cancel</Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="rounded-lg"
                      disabled={addTaskMutation.isPending}
                      onClick={() => addTaskMutation.mutate({ task_type: taskForm.type, notes: taskForm.notes, due_at: taskForm.due_at || null })}
                    >
                      {addTaskMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} className="mr-1" />}
                      Save Task
                    </Button>
                  </div>
                </div>
              )}
              {!taskForm.open && (tasksQuery.data ?? []).length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setTaskForm((f) => ({ ...f, open: true }))} className="w-full rounded-xl">
                  <Plus size={12} className="mr-1" /> Add Task
                </Button>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4 min-h-[300px]">
              {notesQuery.isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              )}
              {notesQuery.isError && <p className="text-sm text-rose-500 text-center py-8">Failed to load notes</p>}
              {!notesQuery.isLoading && !notesQuery.isError && (notesQuery.data ?? []).length === 0 && (
                <EmptyState icon={StickyNote} title="No notes" description="No notes have been added for this patient yet. Add one below." />
              )}
              {!notesQuery.isLoading && (notesQuery.data ?? []).map((note: any) => (
                <div key={note.id} className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{note.created_by ?? 'Agent'}</span>
                    <span className="text-[10px] text-zinc-400">{note.created_at ? formatTs(note.created_at) : ''}</span>
                  </div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Add Note</p>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Type your note here..."
                  rows={3}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-xl"
                  disabled={addNoteMutation.isPending || !newNoteText.trim()}
                  onClick={() => addNoteMutation.mutate(newNoteText.trim())}
                >
                  {addNoteMutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                  Save Note
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default LeadDetailPage;
