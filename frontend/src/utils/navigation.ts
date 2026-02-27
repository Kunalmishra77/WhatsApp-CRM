import { DashboardFilters } from '../types/filters';

export const buildLeadsUrl = (filters: DashboardFilters, extra: Record<string, string> = {}) => {
  const params = new URLSearchParams();
  params.set('preset', filters.preset);
  params.set('from', filters.range.from);
  params.set('to', filters.range.to);
  
  Object.entries(extra).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  
  return `/leads?${params.toString()}`;
};

export const parseLeadsUrl = (search: string): { filters: DashboardFilters; type: string | null } => {
  const params = new URLSearchParams(search);
  const preset = (params.get('preset') as any) || 'weekly';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const type = params.get('type');
  
  return {
    filters: {
      preset,
      range: { from, to }
    },
    type
  };
};
