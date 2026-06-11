/**
 * api.ts  (CORS-safe version)
 * ─────────────────────────────────────────────────────────────
 * All Supabase access now goes through the Express backend (/api/proxy/*).
 * The browser no longer calls Supabase REST directly, which was the root
 * cause of the CORS "Access-Control-Allow-Origin" errors.
 *
 * Exported function signatures are 100% unchanged so callers (DashboardPage,
 * etc.) require zero changes.
 */

import { bGet, bPost, bPatch } from './backendApi';
import type { DateRange, DatePreset } from '../utils/dateRange';
import { computeLeadScore } from '../utils/leadScoring';
import type { ScoringResult, LeadBucket } from '../utils/leadScoring';
import {
  parseISO,
  format,
  differenceInDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth
} from 'date-fns';

// ── Types (unchanged) ─────────────────────────────────────────────────────────
export interface KPIStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  avgLeads: number;
  converted: number;
  unconverted: number;
  pendingDecisions: number;
  avgScore: number;
}

export interface LeadInsightRow {
  id: string;
  created_at: string;
  'User Name': string;
  'Phone Number': string;
  concern: string;
  'lead stage': string;
  'Conversation Summary': string;
  sentiment: string;
  'Action to be taken': string;
  scoring: ScoringResult;
  status?: 'Converted' | 'Unconverted' | 'Pending' | 'InProgress' | 'FollowUpScheduled';
  worked?: boolean;
  owner?: string;
}

export interface TrendPoint {
  name: string;
  hot: number;
  warm: number;
  cold: number;
  converted: number;
  from: string;
  to: string;
}

export interface StagePoint {
  name: string;
  value: number;
  color: string;
}

export interface FollowUpLead {
  id: string;
  name: string;
  phone: string;
  time: string;
  status: string;
  score: number;
  scoring: ScoringResult;
  missingCount: number;
}

export interface WhatsAppPulse {
  incomingChats: number;
  activeSessions: number;
  newContacts: number;
  preInsightSessions: number;
  insightReadySessions: number;
  lastUpdatedAt?: string;
}

export interface WhatsAppTrendPoint {
  name: string;
  messages: number;
  sessions: number;
  contacts: number;
  from: string;
  to: string;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  user_msg: string;
  bot_msg: string;
  stage: string;
}

export interface ChatSession {
  sessionId: string;
  phone: string;
  name: string;
  lastMessage: string;
  lastTimestamp: string;
  status: 'NA' | 'Done';
  leadId?: string;
}

export interface LeadInsightsSummary {
  sentimentTrend: { name: string; pos: number; neu: number; neg: number }[];
  topConcerns: { name: string; count: number }[];
  highIntentLeads: LeadInsightRow[];
}

export interface LeadTask {
  id: string;
  lead_insights_id?: number | null;
  phone_number: string;
  due_at: string;
  task_type: string;
  notes: string;
  created_by: string;
  done: boolean;
  done_at?: string;
  created_at: string;
  lead_name?: string;
}

export interface ReportsData {
  conversionRatio: { name: string; value: number }[];
  sentimentSplit: { name: string; value: number; color: string }[];
  engagementMetrics: { label: string; value: string; delta: string; isUp: boolean }[];
  performanceTrend: { name: string; signals: number; conversions: number }[];
}

export interface ExportHistoryItem {
  id: string;
  created_at: string;
  action_type: string;
  actor_id: string;
  payload: any;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Server-side table existence probe (replaces direct Supabase checkTableSupport) */
const checkTableSupport = async (table: string, columns: string): Promise<boolean> => {
  try {
    const result = await bGet('/proxy/check-table', { table, columns });
    return !!result?.exists;
  } catch {
    return false;
  }
};

// ── Main API Object ───────────────────────────────────────────────────────────
export const dataApi = {

  // ── Dashboard KPIs ─────────────────────────────────────────────────────────
  fetchDashboardKPIs: async (range: DateRange): Promise<KPIStats> => {
    try {
      const hasInsights = await checkTableSupport('lead_insights', 'id');
      if (!hasInsights) {
        console.warn('Table lead_insights not found. Returning empty KPIs.');
        return { totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, avgLeads: 0, converted: 0, unconverted: 0, pendingDecisions: 0, avgScore: 0 };
      }

      const [rawInsightsData, statesData] = await Promise.all([
        bGet('/proxy/insights', { from: range.from, to: range.to }).catch(() => []),
        bGet('/proxy/states').catch(() => [])
      ]);

      const rawInsights = rawInsightsData || [];
      const insights = rawInsights.map((i: any) => ({ ...i, scoring: computeLeadScore(i) }));

      const totalLeads = insights.length;
      const hot = insights.filter((i: any) => i.scoring.bucket === 'Hot').length;
      const warm = insights.filter((i: any) => i.scoring.bucket === 'Warm').length;
      const cold = insights.filter((i: any) => i.scoring.bucket === 'Cold').length;
      const avg = insights.filter((i: any) => i.scoring.bucket === 'Average').length;

      const insightIdsInRange = new Set(rawInsights.map((i: any) => parseInt(i.id)));
      const states = statesData || [];

      const convertedCount = states.filter((s: any) => insightIdsInRange.has(s.lead_insights_id) && s.status_enum === 'Converted').length;
      const unconvertedCount = states.filter((s: any) => insightIdsInRange.has(s.lead_insights_id) && ['NotInterested', 'Closed'].includes(s.status_enum)).length;

      const terminalStates = ['Converted', 'Closed', 'NotInterested'];
      const pendingDecisions = insights.filter((i: any) => {
        const leadId = parseInt(i.id);
        const state = states.find((s: any) => s.lead_insights_id === leadId);
        if (!state) return true;
        return !terminalStates.includes(state.status_enum);
      }).length;

      const sumScore = insights.reduce((acc: number, i: any) => acc + i.scoring.score, 0);
      const avgScore = totalLeads > 0 ? Math.round(sumScore / totalLeads) : 0;

      return { totalLeads, hotLeads: hot, warmLeads: warm, coldLeads: cold, avgLeads: avg, converted: convertedCount, unconverted: unconvertedCount, pendingDecisions, avgScore };
    } catch (e) {
      console.error('KPI fetch error:', e);
      return { totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, avgLeads: 0, converted: 0, unconverted: 0, pendingDecisions: 0, avgScore: 0 };
    }
  },

  // ── Update Lead Status ─────────────────────────────────────────────────────
  updateLeadStatus: async (params: {
    lead: LeadInsightRow;
    status: 'Converted' | 'NotInterested' | 'Closed';
    reason: string;
    note: string;
    range: DateRange & { preset: DatePreset };
  }) => {
    try {
      const { lead, status, reason, note } = params;
      const phone = lead['Phone Number'];

      // 1. Log to lead_comments
      try {
        await bPost('/proxy/comments', {
          phone_number: phone,
          comment_text: `[SYSTEM_ACTION: ${status}] Reason: ${reason}. Note: ${note}`,
          created_by: 'Agent'
        });
      } catch (logErr) {
        console.warn('Logging to lead_comments failed:', logErr);
      }

      // 2. Optional table insert
      const tableName = status === 'Converted' ? 'converted_leads' : 'unconverted_leads';
      try {
        await bPost(`/proxy/optional/${tableName}`, {
          phone_number: phone,
          user_name: lead['User Name'],
          converted_reason: reason,
          converted_note: note,
          raw_snapshot: lead
        });
      } catch (e) {
        console.warn(`Optional table ${tableName} insert failed:`, e);
      }

      // 3. Upsert crm_lead_state
      let finalStatus = status;
      if (status === 'NotInterested' && reason === 'No Response') finalStatus = 'Closed';

      try {
        await bPost('/proxy/states/upsert', {
          phone_number: phone,
          status_enum: finalStatus,
          updated_at: new Date().toISOString(),
          worked_flag: true,
          worked_at: new Date().toISOString()
        });
      } catch (stateError) {
        console.error('State upsert error:', stateError);
        return { success: false, message: 'Database write failed. Check console for detail.' };
      }

      return { success: true };
    } catch (e) {
      console.error('Status update error:', e);
      return { success: false, message: 'Database write failed. Check console for detail.' };
    }
  },

  // ── Fetch Leads ─────────────────────────────────────────────────────────────
  fetchLeads: async (params: {
    range: DateRange;
    bucket?: string;
    status?: string;
    search?: string;
    sentiment?: string;
    missing?: string;
    worked?: 'yes' | 'no' | 'all';
  }): Promise<LeadInsightRow[]> => {
    try {
      const { range, bucket, status, search, sentiment, missing, worked } = params;

      const rawData: any[] = await bGet('/proxy/insights', { from: range.from, to: range.to });

      const leadIds = (rawData || []).map((i: any) => parseInt(i.id));
      let stateMap = new Map<number, any>();
      if (leadIds.length > 0) {
        try {
          const states: any[] = await bGet('/proxy/states', { ids: leadIds.join(',') });
          stateMap = new Map((states || []).map((s: any) => [s.lead_insights_id, s]));
        } catch (e) {
          console.warn('State join failed, raw insights only:', e);
        }
      }

      // Apply search filter
      let filtered = rawData || [];
      if (search) {
        const term = search.toLowerCase();
        filtered = filtered.filter((i: any) =>
          (i['User Name'] || '').toLowerCase().includes(term) ||
          (i['Phone Number'] || '').toLowerCase().includes(term) ||
          (i.concern || '').toLowerCase().includes(term)
        );
      }

      let results: LeadInsightRow[] = filtered.map((i: any) => {
        const state = stateMap.get(parseInt(i.id));
        const enumVal = state?.status_enum;
        let leadStatus: LeadInsightRow['status'] = 'Pending';
        if (enumVal === 'Converted') leadStatus = 'Converted';
        else if (enumVal === 'NotInterested' || enumVal === 'Closed') leadStatus = 'Unconverted';
        else if (enumVal === 'InProgress') leadStatus = 'InProgress';
        else if (enumVal === 'FollowUpScheduled') leadStatus = 'FollowUpScheduled';
        return { ...i, status: leadStatus, worked: !!state?.worked_flag, scoring: computeLeadScore(i) };
      });

      if (bucket && bucket !== 'all') {
        if (['Converted', 'Unconverted', 'Pending'].includes(bucket)) {
          results = results.filter(r => r.status === bucket);
        } else {
          results = results.filter(r => r.scoring.bucket.toLowerCase() === bucket.toLowerCase());
        }
      }
      if (status && status !== 'all') {
        results = results.filter(r => {
          if (status === 'Converted') return r.status === 'Converted';
          if (status === 'Unconverted') return r.status === 'Unconverted';
          if (status === 'Pending') return r.status === 'Pending';
          return r['lead stage']?.toLowerCase() === status.toLowerCase();
        });
      }
      if (sentiment && sentiment !== 'all') {
        results = results.filter(r => r.sentiment?.toLowerCase().includes(sentiment.toLowerCase()));
      }
      if (worked && worked !== 'all') {
        results = results.filter(r => worked === 'yes' ? r.worked : !r.worked);
      }
      if (missing && missing !== 'all') {
        if (missing === 'location') results = results.filter(r => !r.scoring.reasons.some((res: string) => res.includes('Location')));
        else if (missing === 'capacity') results = results.filter(r => !r.scoring.reasons.some((res: string) => res.includes('Capacity')));
      }

      return results;
    } catch (e) {
      console.error('Leads fetch error:', e);
      return [];
    }
  },

  // ── Toggle Worked Status ───────────────────────────────────────────────────
  toggleWorkedStatus: async (leadId: string, phone: string, currentStatus: boolean) => {
    try {
      const isWorking = !currentStatus;

      // Try PATCH first (update existing row)
      const updated: any[] = await bPatch(`/proxy/states/by-phone/${encodeURIComponent(phone)}`, {
        worked_flag: isWorking,
        worked_at: isWorking ? new Date().toISOString() : null,
        status_enum: isWorking ? 'InProgress' : 'New',
        updated_at: new Date().toISOString()
      }).catch(() => []);

      // If nothing was updated, insert a new row
      if (!updated || updated.length === 0) {
        await bPost('/proxy/states/insert', {
          lead_insights_id: parseInt(leadId),
          phone_number: phone,
          worked_flag: isWorking,
          worked_at: isWorking ? new Date().toISOString() : null,
          status_enum: isWorking ? 'InProgress' : 'New',
          updated_at: new Date().toISOString()
        });
      }

      return true;
    } catch (e) {
      console.error('Toggle worked error:', e);
      return false;
    }
  },

  // ── Leads Trend ────────────────────────────────────────────────────────────
  fetchLeadsTrend: async (range: DateRange, preset: DatePreset, bucketFilter?: string): Promise<TrendPoint[]> => {
    try {
      const data: any[] = await bGet('/proxy/insights', { from: range.from, to: range.to });
      let rawInsights = (data || []).map((i: any) => ({ ...i, scoring: computeLeadScore(i) }));

      if (bucketFilter && bucketFilter !== 'all') {
        rawInsights = rawInsights.filter((i: any) => i.scoring.bucket.toLowerCase() === bucketFilter.toLowerCase());
      }

      const startDate = startOfDay(parseISO(range.from));
      const endDate = startOfDay(parseISO(range.to));
      const diffDays = Math.abs(differenceInDays(endDate, startDate));

      let intervals: Date[] = [];
      let intervalType: 'day' | 'week' | 'month' = 'day';

      if (diffDays <= 45) {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        intervalType = 'day';
      } else if (diffDays <= 180) {
        intervals = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
        intervalType = 'week';
      } else {
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        intervalType = 'month';
      }

      return intervals.map(interval => {
        const intervalStr = format(interval, 'yyyy-MM-dd');
        const bucket = rawInsights.filter((i: any) => {
          const d = parseISO(i.created_at);
          if (intervalType === 'day') return format(d, 'yyyy-MM-dd') === intervalStr;
          if (intervalType === 'week') return isSameWeek(d, interval, { weekStartsOn: 1 });
          if (intervalType === 'month') return isSameMonth(d, interval);
          return format(d, 'yyyy-MM-dd') === intervalStr;
        });
        return {
          name: format(interval, intervalType === 'day' ? 'MMM dd' : intervalType === 'week' ? 'dd MMM' : 'MMM yyyy'),
          hot: bucket.filter((i: any) => i.scoring.bucket === 'Hot').length,
          warm: bucket.filter((i: any) => i.scoring.bucket === 'Warm').length,
          cold: bucket.filter((i: any) => i.scoring.bucket === 'Cold').length,
          converted: bucket.filter((i: any) => i.status === 'Converted').length,
          from: format(intervalType === 'day' ? startOfDay(interval) : intervalType === 'week' ? startOfWeek(interval, { weekStartsOn: 1 }) : startOfMonth(interval), 'yyyy-MM-dd'),
          to: format(intervalType === 'day' ? endOfDay(interval) : intervalType === 'week' ? endOfWeek(interval, { weekStartsOn: 1 }) : endOfMonth(interval), 'yyyy-MM-dd'),
        };
      });
    } catch (e) {
      console.error('Trend fetch error:', e);
      return [];
    }
  },

  // ── Stage Distribution ─────────────────────────────────────────────────────
  fetchStageDistribution: async (range: DateRange, bucketFilter?: string): Promise<StagePoint[]> => {
    try {
      const data: any[] = await bGet('/proxy/insights', { from: range.from, to: range.to });
      let rawInsights = (data || []).map((i: any) => ({ ...i, scoring: computeLeadScore(i) }));

      if (bucketFilter && bucketFilter !== 'all') {
        rawInsights = rawInsights.filter((i: any) => i.scoring.bucket.toLowerCase() === bucketFilter.toLowerCase());
      }

      const total = rawInsights.length || 1;
      const buckets: LeadBucket[] = ['Hot', 'Warm', 'Average', 'Cold'];

      return buckets.map(b => {
        const count = rawInsights.filter((i: any) => i.scoring.bucket === b).length;
        return {
          name: b,
          value: Math.round((count / total) * 100),
          color: b === 'Hot' ? '#f43f5e' : b === 'Warm' ? '#f59e0b' : b === 'Average' ? '#10b981' : '#0ea5e9'
        };
      });
    } catch (e) {
      return [];
    }
  },

  // ── Top Follow-Ups ─────────────────────────────────────────────────────────
  fetchTopFollowUps: async (range: DateRange, bucketFilter?: string): Promise<FollowUpLead[]> => {
    try {
      const [data, statesData] = await Promise.all([
        bGet('/proxy/insights', { from: range.from, to: range.to }),
        bGet('/proxy/states')
      ]);

      const stateMap = new Map(((statesData as any[]) || []).map((s: any) => [s.lead_insights_id, s]));

      let rawInsights = ((data as any[]) || []).map((i: any) => {
        const scoring = computeLeadScore(i);
        const state = stateMap.get(parseInt(i.id));
        return {
          name: i['User Name'] || 'Unknown',
          phone: i['Phone Number'] || 'N/A',
          time: format(parseISO(i.created_at), 'hh:mm a'),
          status: scoring.bucket,
          score: scoring.score,
          isWorked: !!state?.worked_flag,
          terminal: ['Converted', 'Closed', 'NotInterested'].includes(state?.status_enum || ''),
          missingCount: 2 - (scoring.reasons.some((r: string) => r.includes('Location')) ? 1 : 0) - (scoring.reasons.some((r: string) => r.includes('Capacity')) ? 1 : 0),
          scoring,
          id: i.id
        };
      });

      if (bucketFilter && bucketFilter !== 'all') {
        rawInsights = rawInsights.filter(i => i.status.toLowerCase() === bucketFilter.toLowerCase());
      }

      return rawInsights
        .filter(i => !i.terminal)
        .sort((a, b) => {
          if (a.isWorked !== b.isWorked) return a.isWorked ? 1 : -1;
          if (b.score !== a.score) return b.score - a.score;
          return b.missingCount - a.missingCount;
        })
        .slice(0, 10);
    } catch (e) {
      return [];
    }
  },

  // ── Funnel ─────────────────────────────────────────────────────────────────
  fetchFunnel: async (range: DateRange, bucketFilter?: string) => {
    try {
      const [insightsData, statesData] = await Promise.all([
        bGet('/proxy/insights', { from: range.from, to: range.to }),
        bGet('/proxy/states')
      ]);

      let insights: any[] = insightsData || [];

      if (bucketFilter && bucketFilter !== 'all') {
        insights = insights.filter((i: any) => computeLeadScore(i).bucket.toLowerCase() === bucketFilter.toLowerCase());
      }

      const states: any[] = statesData || [];
      const total = insights.length;

      if (total === 0) {
        return [
          { label: 'New', val: '0%', color: 'bg-teal-500' },
          { label: 'Progress', val: '0%', color: 'bg-emerald-500' },
          { label: 'Followup', val: '0%', color: 'bg-amber-500' },
          { label: 'Converted', val: '0%', color: 'bg-rose-500' },
        ];
      }

      const insightIds = new Set(insights.map((i: any) => parseInt(i.id)));
      const relevantStates = states.filter((s: any) => insightIds.has(s.lead_insights_id));

      const converted = relevantStates.filter((s: any) => s.status_enum === 'Converted').length;
      const progress = relevantStates.filter((s: any) => ['InProgress', 'FollowUpScheduled', 'Converted'].includes(s.status_enum)).length;
      const followup = relevantStates.filter((s: any) => s.status_enum === 'FollowUpScheduled').length;

      return [
        { label: 'New', val: '100%', color: 'bg-teal-500' },
        { label: 'Progress', val: `${Math.round((progress / total) * 100)}%`, color: 'bg-emerald-500' },
        { label: 'Followup', val: `${Math.round((followup / total) * 100)}%`, color: 'bg-amber-500' },
        { label: 'Converted', val: `${Math.round((converted / total) * 100)}%`, color: 'bg-rose-500' },
      ];
    } catch (e) {
      return [
        { label: 'New', val: '0%', color: 'bg-teal-500' },
        { label: 'Progress', val: '0%', color: 'bg-emerald-500' },
        { label: 'Followup', val: '0%', color: 'bg-amber-500' },
        { label: 'Converted', val: '0%', color: 'bg-rose-500' },
      ];
    }
  },

  // ── Agent Performance ──────────────────────────────────────────────────────
  fetchAgentPerformance: async (_range: DateRange) => {
    try {
      const hasAgentSupport = await checkTableSupport('crm_lead_state', 'owner_user_id, status_enum');

      if (!hasAgentSupport) {
        return [];
      }

      const states: any[] = await bGet('/proxy/states').catch(() => []);
      const withOwner = (states || []).filter((s: any) => s.owner_user_id);

      if (withOwner.length === 0) {
        return [];
      }

      const agentMap = new Map<string, { leads: number; converted: number }>();
      withOwner.forEach((s: any) => {
        const owner = s.owner_user_id || 'Unassigned';
        const current = agentMap.get(owner) || { leads: 0, converted: 0 };
        current.leads++;
        if (s.status_enum === 'Converted') current.converted++;
        agentMap.set(owner, current);
      });

      return Array.from(agentMap.entries())
        .map(([name, stats]) => ({
          name,
          leads: stats.leads,
          conv: stats.leads > 0 ? `${Math.round((stats.converted / stats.leads) * 100)}%` : '0%',
          color: stats.converted / stats.leads > 0.1 ? 'bg-teal-500' : 'bg-blue-500'
        }))
        .sort((a, b) => b.leads - a.leads);
    } catch (e) {
      console.error('Agent performance fetch error:', e);
      return [];
    }
  },

  // ── WhatsApp Pulse ─────────────────────────────────────────────────────────
  fetchWhatsAppPulse: async (range: DateRange): Promise<WhatsAppPulse> => {
    try {
      const data: any[] = await bGet('/proxy/conversations/range', { from: range.from, to: range.to });
      const convs = data || [];
      const sessions = new Set(convs.map((c: any) => c['Session ID'])).size;
      const contacts = new Set(convs.map((c: any) => c['Phone Number'])).size;
      const preInsight = new Set(convs.filter((c: any) => c.summery === 'NA').map((c: any) => c['Session ID'])).size;
      const readyInsight = new Set(convs.filter((c: any) => c.summery === 'Done').map((c: any) => c['Session ID'])).size;

      return {
        incomingChats: convs.length,
        activeSessions: sessions,
        newContacts: contacts,
        preInsightSessions: preInsight,
        insightReadySessions: readyInsight,
        lastUpdatedAt: new Date().toISOString()
      };
    } catch (e) {
      console.error('Pulse fetch error:', e);
      return { incomingChats: 0, activeSessions: 0, newContacts: 0, preInsightSessions: 0, insightReadySessions: 0 };
    }
  },

  // ── WhatsApp Trend ─────────────────────────────────────────────────────────
  fetchWhatsAppTrend: async (range: DateRange, preset: DatePreset): Promise<WhatsAppTrendPoint[]> => {
    try {
      const data: any[] = await bGet('/proxy/conversations/range', { from: range.from, to: range.to });
      const convs = data || [];

      const startDate = startOfDay(parseISO(range.from));
      const endDate = startOfDay(parseISO(range.to));
      const diffDays = Math.abs(differenceInDays(endDate, startDate));

      let intervals: Date[] = [];
      let intervalType: 'day' | 'week' | 'month' = 'day';

      if (diffDays <= 45) {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        intervalType = 'day';
      } else if (diffDays <= 180) {
        intervals = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
        intervalType = 'week';
      } else {
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        intervalType = 'month';
      }

      return intervals.map(interval => {
        const intervalStr = format(interval, 'yyyy-MM-dd');
        const bucket = convs.filter((c: any) => {
          const d = parseISO(c.Timestamp);
          if (intervalType === 'day') return format(d, 'yyyy-MM-dd') === intervalStr;
          if (intervalType === 'week') return isSameWeek(d, interval, { weekStartsOn: 1 });
          if (intervalType === 'month') return isSameMonth(d, interval);
          return format(d, 'yyyy-MM-dd') === intervalStr;
        });
        return {
          name: format(interval, intervalType === 'day' ? 'MMM dd' : intervalType === 'week' ? 'dd MMM' : 'MMM yyyy'),
          messages: bucket.length,
          sessions: new Set(bucket.map((c: any) => c['Session ID'])).size,
          contacts: new Set(bucket.map((c: any) => c['Phone Number'])).size,
          from: format(intervalType === 'day' ? startOfDay(interval) : intervalType === 'week' ? startOfWeek(interval, { weekStartsOn: 1 }) : startOfMonth(interval), 'yyyy-MM-dd'),
          to: format(intervalType === 'day' ? endOfDay(interval) : intervalType === 'week' ? endOfWeek(interval, { weekStartsOn: 1 }) : endOfMonth(interval), 'yyyy-MM-dd'),
        };
      });
    } catch (e) {
      console.error('WhatsApp trend fetch error:', e);
      return [];
    }
  },

  // ── Fetch Sessions (for Live Inbox) ────────────────────────────────────────
  fetchSessions: async (range: DateRange): Promise<ChatSession[]> => {
    try {
      const data: any[] = await bGet('/proxy/conversations/range', { from: range.from, to: range.to });

      const sessionsMap = new Map<string, ChatSession>();
      (data || []).forEach((row: any) => {
        const sid = row['Session ID'];
        if (!sessionsMap.has(sid)) {
          sessionsMap.set(sid, {
            sessionId: sid,
            phone: row['Phone Number'],
            name: row['User Name'] || 'Unknown',
            lastMessage: row['User Message'] || row['Bot Response'],
            lastTimestamp: row['Timestamp'],
            status: row.summery === 'NA' ? 'NA' : 'Done'
          });
        }
      });

      return Array.from(sessionsMap.values());
    } catch (e) {
      console.error('Sessions fetch error:', e);
      return [];
    }
  },

  // ── Fetch Conversation (by session ID) ────────────────────────────────────
  fetchConversation: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const data: any[] = await bGet(`/proxy/conversations/session/${encodeURIComponent(sessionId)}`);
      return (data || []).map((row: any) => ({
        id: row.id,
        timestamp: row.Timestamp,
        user_msg: row['User Message'],
        bot_msg: row['Bot Response'],
        stage: row['Conversation Stage']
      }));
    } catch (e) {
      console.error('Conversation fetch error:', e);
      return [];
    }
  },

  // ── Fetch Single Lead by Phone ─────────────────────────────────────────────
  fetchLeadInsightByPhone: async (phone: string): Promise<LeadInsightRow | null> => {
    try {
      const data = await bGet(`/proxy/insights/by-phone/${encodeURIComponent(phone)}`);
      if (!data) return null;
      return { ...data, scoring: computeLeadScore(data) };
    } catch (e) {
      return null;
    }
  },

  // ── Lead Insights Summary (for LeadInsights page) ─────────────────────────
  fetchLeadInsightsSummary: async (range: DateRange): Promise<LeadInsightsSummary> => {
    try {
      const data: any[] = await bGet('/proxy/insights', { from: range.from, to: range.to });
      const raw = (data || []).map((i: any) => ({ ...i, scoring: computeLeadScore(i) }));

      const startDate = startOfDay(parseISO(range.from));
      const endDate = startOfDay(parseISO(range.to));
      const intervals = eachDayOfInterval({ start: startDate, end: endDate });

      const sentimentTrend = intervals.map(day => {
        const dStr = format(day, 'yyyy-MM-dd');
        const bucket = raw.filter((i: any) => format(parseISO(i.created_at), 'yyyy-MM-dd') === dStr);
        return {
          name: format(day, 'MMM dd'),
          pos: bucket.filter((i: any) => i.sentiment?.toLowerCase().includes('pos')).length,
          neu: bucket.filter((i: any) => i.sentiment?.toLowerCase().includes('neu') || (!i.sentiment?.toLowerCase().includes('pos') && !i.sentiment?.toLowerCase().includes('neg'))).length,
          neg: bucket.filter((i: any) => i.sentiment?.toLowerCase().includes('neg')).length,
        };
      });

      const concernsMap = new Map<string, number>();
      raw.forEach((i: any) => {
        const c = i.concern || 'General Query';
        const normalized = c.length > 30 ? c.substring(0, 30) + '...' : c;
        concernsMap.set(normalized, (concernsMap.get(normalized) || 0) + 1);
      });
      const topConcerns = Array.from(concernsMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const highIntentLeads = raw
        .filter((i: any) => i.scoring.bucket === 'Hot' || i.scoring.score > 80)
        .sort((a: any, b: any) => b.scoring.score - a.scoring.score)
        .slice(0, 10);

      return { sentimentTrend, topConcerns, highIntentLeads };
    } catch (e) {
      console.error('Insights summary error:', e);
      return { sentimentTrend: [], topConcerns: [], highIntentLeads: [] };
    }
  },

  // ── Fetch Tasks ────────────────────────────────────────────────────────────
  fetchTasks: async (_range: DateRange): Promise<LeadTask[]> => {
    try {
      const tasksData: any[] = await bGet('/proxy/tasks');

      if (!tasksData || tasksData.length === 0) return [];

      // Join lead names
      const leadIds = Array.from(new Set(tasksData.map((t: any) => t.lead_insights_id).filter((id: any) => id !== null)));
      let leadMap = new Map<number, string>();
      if (leadIds.length > 0) {
        try {
          const leads: any[] = await bGet('/proxy/insights/by-ids', { ids: leadIds.join(',') });
          leadMap = new Map((leads || []).map((l: any) => [parseInt(l.id), l['User Name']]));
        } catch (e) {
          console.warn('Task name join failed:', e);
        }
      }

      return tasksData.map((t: any) => ({ ...t, lead_name: leadMap.get(t.lead_insights_id) || 'Unknown' }));
    } catch (e) {
      console.error('Tasks fetch error:', e);
      return [];
    }
  },

  // ── Create Task ────────────────────────────────────────────────────────────
  createTask: async (task: Partial<LeadTask>) => {
    try {
      let finalTask = { ...task };

      // Resolve lead_insights_id from phone if missing
      if (task.phone_number && !task.lead_insights_id) {
        try {
          const lead = await bGet(`/proxy/insights/by-phone/${encodeURIComponent(task.phone_number)}`);
          if (lead) finalTask.lead_insights_id = parseInt(lead.id);
        } catch (_) { }
      }

      await bPost('/proxy/tasks', finalTask);
      return true;
    } catch (e) {
      console.error('Task creation error:', e);
      return false;
    }
  },

  // ── Toggle Task Done ───────────────────────────────────────────────────────
  toggleTaskDone: async (id: string, currentStatus: boolean) => {
    try {
      await bPatch(`/proxy/tasks/${id}`, {
        done: !currentStatus,
        done_at: !currentStatus ? new Date().toISOString() : null
      });
      return true;
    } catch (e) {
      console.error('Task toggle error:', e);
      return false;
    }
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  fetchReportsData: async (range: DateRange): Promise<ReportsData> => {
    try {
      const [insightsRaw, statesRaw] = await Promise.all([
        bGet('/proxy/insights', { from: range.from, to: range.to }),
        bGet('/proxy/states'),
        bGet('/proxy/conversations/range', { from: range.from, to: range.to })
      ]);

      const rawInsights = ((insightsRaw as any[]) || []).map((i: any) => ({ ...i, scoring: computeLeadScore(i) }));
      const states = (statesRaw as any[]) || [];
      const insightIds = new Set(rawInsights.map((i: any) => parseInt(i.id)));
      const relevantStates = states.filter((s: any) => insightIds.has(s.lead_insights_id));

      const total = rawInsights.length;
      const converted = relevantStates.filter((s: any) => s.status_enum === 'Converted').length;
      const lost = relevantStates.filter((s: any) => ['NotInterested', 'Closed'].includes(s.status_enum)).length;

      const conversionRatio = [
        { name: 'Converted', value: converted },
        { name: 'Lost', value: lost },
        { name: 'In Pipeline', value: total - converted - lost }
      ];

      const sentimentSplit = [
        { name: 'Positive', value: rawInsights.filter((i: any) => i.sentiment?.toLowerCase().includes('pos')).length, color: '#10b981' },
        { name: 'Neutral', value: rawInsights.filter((i: any) => i.sentiment?.toLowerCase().includes('neu')).length, color: '#71717a' },
        { name: 'Negative', value: rawInsights.filter((i: any) => i.sentiment?.toLowerCase().includes('neg')).length, color: '#f43f5e' }
      ];

      const posSentiment = rawInsights.filter((i: any) => i.sentiment?.toLowerCase().includes('pos')).length;
      const daysInRange = Math.max(1, Math.ceil((new Date(range.to).getTime() - new Date(range.from).getTime()) / (1000 * 60 * 60 * 24)));
      const engagementMetrics = [
        { label: 'Total Leads', value: String(total), delta: '-', isUp: true },
        { label: 'Conversion Rate', value: total > 0 ? `${Math.round((converted / total) * 100)}%` : '0%', delta: '-', isUp: true },
        { label: 'Positive Sentiment', value: total > 0 ? `${Math.round((posSentiment / total) * 100)}%` : '0%', delta: '-', isUp: true },
        { label: 'Lead Velocity', value: `${(total / daysInRange).toFixed(1)}/day`, delta: '-', isUp: true },
      ];

      const startDate = startOfDay(parseISO(range.from));
      const endDate = startOfDay(parseISO(range.to));
      const intervals = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });

      const performanceTrend = intervals.map(week => {
        const bucket = rawInsights.filter((i: any) => isSameDay(parseISO(i.created_at), week) || (parseISO(i.created_at) >= startOfWeek(week, { weekStartsOn: 1 }) && parseISO(i.created_at) <= endOfWeek(week, { weekStartsOn: 1 })));
        const bucketIds = new Set(bucket.map((i: any) => parseInt(i.id)));
        const convInBucket = states.filter((s: any) => bucketIds.has(s.lead_insights_id) && s.status_enum === 'Converted').length;
        return { name: format(week, 'dd MMM'), signals: bucket.length, conversions: convInBucket };
      });

      return { conversionRatio, sentimentSplit, engagementMetrics, performanceTrend };
    } catch (e) {
      console.error('Reports fetch error:', e);
      return { conversionRatio: [], sentimentSplit: [], engagementMetrics: [], performanceTrend: [] };
    }
  },

  // ── Export History ─────────────────────────────────────────────────────────
  fetchExportHistory: async (range: DateRange): Promise<ExportHistoryItem[]> => {
    try {
      const data: any[] = await bGet('/proxy/comments', {
        from: range.from,
        to: range.to,
        like: '[EXPORT:%'
      });

      return (data || []).map((row: any) => {
        const match = row.comment_text.match(/\[EXPORT:(.*?)\] Count: (\d+)/);
        return {
          id: row.id,
          created_at: row.created_at,
          action_type: 'LEAD_EXPORT',
          actor_id: row.created_by,
          payload: { format: match?.[1] || 'csv', count: parseInt(match?.[2] || '0') }
        };
      });
    } catch (e) {
      console.error('Export history error:', e);
      return [];
    }
  },

  // ── Log Export Action ──────────────────────────────────────────────────────
  logExportAction: async (fmt: string, count: number, _range: DateRange) => {
    try {
      await bPost('/proxy/comments', {
        comment_text: `[EXPORT:${fmt}] Count: ${count}`,
        phone_number: 'SYSTEM',
        created_by: 'Agent'
      });
    } catch (e) {
      console.warn('Failed to log export action:', e);
    }
  }
};
