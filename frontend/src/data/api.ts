import { supabase } from './supabase';
import type { DateRange, DatePreset } from '../utils/dateRange';
import { computeLeadScore } from '../utils/leadScoring';
import type { ScoringResult, LeadBucket } from '../utils/leadScoring';
import { 
  parseISO, 
  format, 
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

const T_INSIGHTS = 'lead_insights';

export interface KPIStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  avgLeads: number;
  converted: number;
  unconverted: number;
  avgScore: number;
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
  name: string;
  phone: string;
  time: string;
  status: string;
  score: number;
  scoring?: ScoringResult;
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
}

export const dataApi = {
  fetchDashboardKPIs: async (range: DateRange): Promise<KPIStats> => {
    try {
      const { data, error } = await supabase
        .from(T_INSIGHTS)
        .select('*')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`);

      if (error) throw error;

      const rawInsights = data || [];
      const insights = rawInsights.map(i => ({
        ...i,
        scoring: computeLeadScore(i)
      }));

      const totalLeads = insights.length;
      const hot = insights.filter(i => i.scoring.bucket === 'Hot').length;
      const warm = insights.filter(i => i.scoring.bucket === 'Warm').length;
      const cold = insights.filter(i => i.scoring.bucket === 'Cold').length;
      const avg = insights.filter(i => i.scoring.bucket === 'Average').length;
      
      const converted = insights.filter(i => i['lead stage']?.toLowerCase() === 'converted').length;
      const unconverted = totalLeads - converted;
      
      const sumScore = insights.reduce((acc, i) => acc + i.scoring.score, 0);
      const avgScore = totalLeads > 0 ? Math.round(sumScore / totalLeads) : 0;

      return {
        totalLeads,
        hotLeads: hot,
        warmLeads: warm,
        coldLeads: cold,
        avgLeads: avg,
        converted,
        unconverted,
        avgScore
      };
    } catch (e) {
      console.error('KPI fetch error:', e);
      return { totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, avgLeads: 0, converted: 0, unconverted: 0, avgScore: 0 };
    }
  },

  fetchLeadsTrend: async (range: DateRange, preset: DatePreset): Promise<TrendPoint[]> => {
    try {
      const { data, error } = await supabase
        .from(T_INSIGHTS)
        .select('*')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`);

      if (error) throw error;

      const rawInsights = data || [];
      const insights = rawInsights.map(i => ({
        ...i,
        scoring: computeLeadScore(i)
      }));

      const startDate = parseISO(range.from);
      const endDate = parseISO(range.to);

      let intervals: Date[] = [];
      if (preset === 'daily') intervals = eachDayOfInterval({ start: startDate, end: endDate });
      else if (preset === 'weekly') intervals = eachWeekOfInterval({ start: startDate, end: endDate });
      else if (preset === 'monthly') intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      else intervals = eachDayOfInterval({ start: startDate, end: endDate });

      return intervals.map(interval => {
        const bucket = insights.filter(i => {
          const d = parseISO(i.created_at);
          if (preset === 'daily') return isSameDay(d, interval);
          if (preset === 'weekly') return isSameWeek(d, interval);
          if (preset === 'monthly') return isSameMonth(d, interval);
          return isSameDay(d, interval);
        });

        return {
          name: format(interval, preset === 'daily' ? 'MMM dd' : preset === 'weekly' ? 'dd MMM' : 'MMM yyyy'),
          hot: bucket.filter(i => i.scoring.bucket === 'Hot').length,
          warm: bucket.filter(i => i.scoring.bucket === 'Warm').length,
          cold: bucket.filter(i => i.scoring.bucket === 'Cold').length,
          converted: bucket.filter(i => i['lead stage']?.toLowerCase() === 'converted').length,
          from: format(
            preset === 'daily' ? startOfDay(interval) : 
            preset === 'weekly' ? startOfWeek(interval, { weekStartsOn: 1 }) : 
            startOfMonth(interval), 
            'yyyy-MM-dd'
          ),
          to: format(
            preset === 'daily' ? endOfDay(interval) : 
            preset === 'weekly' ? endOfWeek(interval, { weekStartsOn: 1 }) : 
            endOfMonth(interval), 
            'yyyy-MM-dd'
          ),
        };
      });
    } catch (e) {
      console.error('Trend fetch error:', e);
      return [];
    }
  },

  fetchStageDistribution: async (range: DateRange): Promise<StagePoint[]> => {
    try {
      const { data, error } = await supabase
        .from(T_INSIGHTS)
        .select('*')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`);

      if (error) throw error;

      const rawInsights = data || [];
      const insights = rawInsights.map(i => ({
        ...i,
        scoring: computeLeadScore(i)
      }));

      const total = insights.length || 1;
      const buckets: LeadBucket[] = ['Hot', 'Warm', 'Average', 'Cold'];
      
      return buckets.map(b => {
        const count = insights.filter(i => i.scoring.bucket === b).length;
        return {
          name: b,
          value: Math.round((count / total) * 100),
          color: b === 'Hot' ? '#f43f5e' : 
                 b === 'Warm' ? '#f59e0b' : 
                 b === 'Average' ? '#10b981' : '#0ea5e9'
        };
      });
    } catch (e) {
      return [];
    }
  },

  fetchTopFollowUps: async (range: DateRange): Promise<FollowUpLead[]> => {
    try {
      const { data, error } = await supabase
        .from(T_INSIGHTS)
        .select('*')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`);

      if (error) throw error;

      const rawInsights = data || [];
      return rawInsights
        .map(i => {
          const scoring = computeLeadScore(i);
          return {
            name: i['User Name'] || 'Unknown',
            phone: i['Phone Number'] || 'N/A',
            time: format(parseISO(i.created_at), 'hh:mm a'),
            status: scoring.bucket,
            score: scoring.score,
            scoring
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (e) {
      return [];
    }
  },

  fetchLeads: async (params: { 
    range: DateRange; 
    bucket?: string; 
    status?: string;
    search?: string;
    sentiment?: string;
    missing?: string;
  }): Promise<LeadInsightRow[]> => {
    try {
      const { range, bucket, status, search, sentiment, missing } = params;
      let query = supabase
        .from(T_INSIGHTS)
        .select('*')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`"User Name".ilike.%${search}%,"Phone Number".ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data || []).map(i => ({
        ...i,
        scoring: computeLeadScore(i)
      }));

      if (bucket && bucket !== 'all') {
        results = results.filter(r => r.scoring.bucket.toLowerCase() === bucket.toLowerCase());
      }

      if (status && status !== 'all') {
        results = results.filter(r => r['lead stage']?.toLowerCase() === status.toLowerCase());
      }

      if (sentiment && sentiment !== 'all') {
        results = results.filter(r => r.sentiment?.toLowerCase().includes(sentiment.toLowerCase()));
      }

      if (missing && missing !== 'all') {
        if (missing === 'location') {
          results = results.filter(r => !r.scoring.reasons.some(res => res.includes('Location')));
        } else if (missing === 'capacity') {
          results = results.filter(r => !r.scoring.reasons.some(res => res.includes('Capacity')));
        }
      }

      return results;
    } catch (e) {
      console.error('Leads fetch error:', e);
      return [];
    }
  },

  fetchFunnel: async (_range: DateRange) => {
    return [
      { label: 'New', val: '100%', color: 'bg-teal-500' },
      { label: 'Progress', val: '64%', color: 'bg-emerald-500' },
      { label: 'Followup', val: '32%', color: 'bg-amber-500' },
      { label: 'Converted', val: '12%', color: 'bg-rose-500' },
    ];
  },

  fetchAgentPerformance: async (_range: DateRange) => {
    return [
      { name: 'Rahul S.', leads: 142, conv: '12%', color: 'bg-teal-500' },
      { name: 'Sanya M.', leads: 128, conv: '15%', color: 'bg-emerald-500' },
      { name: 'Arjun K.', leads: 95, conv: '8%', color: 'bg-sky-500' },
    ];
  }
};
