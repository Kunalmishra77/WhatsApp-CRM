import React, { useState } from 'react';
import { Calendar, Clock, BarChart, CalendarDays, CalendarRange, Map, Layers } from 'lucide-react';
import { CustomDropdown } from './ui/dropdown';
import { useDashboardFilters } from '../state/dashboardFilterStore';
import { DatePreset } from '../types/filters';
import { RangeModal } from './RangeModal';
import { toast } from 'sonner';
import { getLabel } from '../utils/dateRange';

export const RangeDropdown: React.FC = () => {
  const { filters, setPreset, setCustomRange } = useDashboardFilters();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const options = [
    { value: 'daily', label: 'Daily', icon: Clock },
    { value: 'weekly', label: 'Weekly', icon: CalendarDays },
    { value: 'monthly', label: 'Monthly', icon: Calendar },
    { value: 'quarterly', label: 'Quarterly', icon: BarChart },
    { value: 'halfYearly', label: 'Half-yearly', icon: Map },
    { value: 'yearly', label: 'Annually', icon: Layers },
    { value: 'custom', label: 'Custom Range', icon: CalendarRange },
  ];

  const handleChange = (value: string) => {
    if (value === 'custom') {
      setIsModalOpen(true);
    } else {
      const preset = value as DatePreset;
      setPreset(preset);
      
      // Delay slightly to ensure store is updated before reading label for toast
      setTimeout(() => {
        toast.success(`Range updated: ${getLabel(preset, filters.range)}`, {
          description: `${filters.range.from} to ${filters.range.to}`,
          position: 'top-right',
        });
      }, 0);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase text-[hsl(var(--text-dim))] tracking-[0.2em] hidden sm:inline">Range</span>
        <CustomDropdown
          options={options}
          value={filters.preset}
          onChange={handleChange}
          icon={Calendar}
          className="w-[180px]"
        />
      </div>

      <RangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialRange={filters.range}
        onApply={(range) => {
          setCustomRange(range);
          toast.success(`Custom range applied`, {
            description: `${range.from} to ${range.to}`,
            position: 'top-right',
          });
        }}
      />
    </>
  );
};
