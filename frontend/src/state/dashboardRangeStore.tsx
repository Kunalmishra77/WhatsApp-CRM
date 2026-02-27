import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DatePreset, DateRange } from '../utils/dateRange';
import { getRangeFromPreset } from '../utils/dateRange';

interface DashboardRangeContextType {
  preset: DatePreset;
  range: DateRange;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (from: string, to: string) => void;
}

const DashboardRangeContext = createContext<DashboardRangeContextType | undefined>(undefined);

const PRESET_STORAGE_KEY = 'crm_dashboard_preset';
const RANGE_STORAGE_KEY = 'crm_dashboard_range';

export const DashboardRangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{ preset: DatePreset; range: DateRange }>(() => {
    const savedPreset = localStorage.getItem(PRESET_STORAGE_KEY) as DatePreset;
    const savedRange = localStorage.getItem(RANGE_STORAGE_KEY);
    
    const preset = savedPreset || 'weekly';
    let range: DateRange;

    if (preset === 'custom' && savedRange) {
      try {
        range = JSON.parse(savedRange);
      } catch {
        range = getRangeFromPreset('weekly');
      }
    } else {
      range = getRangeFromPreset(preset);
    }

    return { preset, range };
  });

  const setPreset = useCallback((preset: DatePreset) => {
    const range = getRangeFromPreset(preset);
    setState({ preset, range });
    localStorage.setItem(PRESET_STORAGE_KEY, preset);
    if (preset !== 'custom') {
      localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(range));
    }
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    const range = { from, to };
    setState({ preset: 'custom', range });
    localStorage.setItem(PRESET_STORAGE_KEY, 'custom');
    localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(range));
  }, []);

  return (
    <DashboardRangeContext.Provider value={{ ...state, setPreset, setCustomRange }}>
      {children}
    </DashboardRangeContext.Provider>
  );
};

export const useDashboardRange = () => {
  const context = useContext(DashboardRangeContext);
  if (!context) {
    throw new Error('useDashboardRange must be used within a DashboardRangeProvider');
  }
  return context;
};
