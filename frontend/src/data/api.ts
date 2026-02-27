import { supabase } from './supabase';
import { DateRange, DatePreset } from '../utils/dateRange';
import { 
  parseISO, 
  format, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth
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

      const insights = data || [];
      const totalLeads = insights.length;
      
      const hot = insights.filter(i => i['lead stage']?.toLowerCase() === 'hot').length;
      const warm = insights.filter(i => i['lead stage']?.toLowerCase() === 'warm').length;
      const cold = insights.filter(i => i['lead stage']?.toLowerCase() === 'cold').length;
      const avg = insights.filter(i => i['lead stage']?.toLowerCase() === 'average' || i['lead stage']?.toLowerCase() === 'avg').length;
      
      const converted = insights.filter(i => i['lead stage']?.toLowerCase() === 'converted').length;
      const unconverted = totalLeads - converted;

      return {
        totalLeads,
        hotLeads: hot,
        warmLeads: warm,
        coldLeads: cold,
        avgLeads: avg,
        converted,
        unconverted,
        avgScore: 72
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
        .select('created_at, "lead stage"')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`);

      if (error) throw error;

      const insights = data || [];
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
          hot: bucket.filter(i => i['lead stage']?.toLowerCase() === 'hot').length,
          warm: bucket.filter(i => i['lead stage']?.toLowerCase() === 'warm').length,
          cold: bucket.filter(i => i['lead stage']?.toLowerCase() === 'cold').length,
          converted: bucket.filter(i => i['lead stage']?.toLowerCase() === 'converted').length,
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
        .select('"lead stage"')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`);

      if (error) throw error;

      const insights = data || [];
      const total = insights.length || 1;
      
      const counts = insights.reduce((acc: Record<string, number>, i) => {
        const stage = i['lead stage'] || 'Unknown';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100),
        color: name.toLowerCase() === 'hot' ? '#f43f5e' : 
               name.toLowerCase() === 'warm' ? '#f59e0b' : 
               name.toLowerCase() === 'cold' ? '#0ea5e9' : '#10b981'
      }));
    } catch (e) {
      console.error('Stage distribution error:', e);
      return [];
    }
  },

  fetchTopFollowUps: async (range: DateRange): Promise<FollowUpLead[]> => {
    try {
      const { data, error } = await supabase
        .from(T_INSIGHTS)
        .select('*')
        .gte('created_at', `${range.from}T00:00:00Z`)
        .lte('created_at', `${range.to}T23:59:59Z`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(i => ({
        name: i['User Name'] || 'Unknown',
        phone: i['Phone Number'] || 'N/A',
        time: format(parseISO(i.created_at), 'hh:mm a'),
        status: i['lead stage'] || 'Warm',
        score: Math.floor(Math.random() * 40) + 60
      }));
    } catch (e) {
      console.error('Follow-ups error:', e);
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
