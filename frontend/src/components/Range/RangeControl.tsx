import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useRange } from '../../state/globalRangeStore';
import { formatRangeLabel, type DatePreset } from '../../utils/dateRange';
import { FixedDropdown } from '../../ui/FixedDropdown';
import { CustomRangeModal } from '../../ui/CustomRangeModal';
import { toast } from 'sonner';

const PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'halfYearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Range' },
];

export const RangeControl: React.FC = () => {
  const { preset, from, to, setPreset, setCustomRange } = useRange();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePresetChange = (newPreset: string) => {
    const p = newPreset as DatePreset;
    if (p === 'custom') {
      setIsModalOpen(true);
    } else {
      setPreset(p);
      // Wait for state to update or use calculate locally for immediate toast accuracy
      // For simplicity, we can calculate label after a tiny delay or use the new values
      // But formatRangeLabel with the preset and calculated dates is better.
      // Actually setPreset in rangeStore handles the calculation.
      // We can just show a generic "Range updated" and rely on the label in UI updating.
      toast.success("Range updated", { description: p.charAt(0).toUpperCase() + p.slice(1) });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
        <Calendar size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
          {formatRangeLabel(preset, from, to)}
        </span>
      </div>
      
      <FixedDropdown 
        options={PRESET_OPTIONS}
        value={preset}
        onChange={handlePresetChange}
        className="w-40"
      />

      <CustomRangeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialFrom={from}
        initialTo={to}
        onApply={setCustomRange}
      />
    </div>
  );
};
