import { 
  format, 
  startOfToday, 
  endOfToday, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  subMonths,
  subDays,
  parseISO
} from 'date-fns';

export type DatePreset = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'halfYearly' | 'yearly' | 'custom';

export interface DateRange {
  from: string; // ISO (YYYY-MM-DD)
  to: string;   // ISO (YYYY-MM-DD)
}

export const getRangeFromPreset = (preset: DatePreset, now: Date = new Date()): DateRange => {
  let from: Date;
  let to: Date = endOfToday();

  switch (preset) {
    case 'daily':
      from = startOfToday();
      break;
    case 'weekly':
      from = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      to = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    case 'quarterly':
      from = startOfQuarter(now);
      to = endOfQuarter(now);
      break;
    case 'halfYearly':
      from = subMonths(startOfMonth(now), 5);
      to = endOfMonth(now);
      break;
    case 'yearly':
      from = startOfYear(now);
      to = endOfYear(now);
      break;
    case 'custom':
    default:
      from = subDays(now, 7);
      to = now;
      break;
  }

  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd')
  };
};

export const getLabelForRange = (preset: DatePreset, range: DateRange): string => {
  if (preset === 'custom') {
    return `${range.from} – ${range.to}`;
  }
  
  const labels: Record<DatePreset, string> = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    quarterly: 'This Quarter',
    halfYearly: 'Last 6 Months',
    yearly: 'This Year',
    custom: 'Custom'
  };
  
  const label = labels[preset];
  return `${label} (${format(parseISO(range.from), 'dd MMM')} – ${format(parseISO(range.to), 'dd MMM')})`;
};
