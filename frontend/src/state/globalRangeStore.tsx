import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { DatePreset, DateRange } from '../utils/dateRange';
import { getRangeFromPreset } from '../utils/dateRange';

interface RangeContextType {
  preset: DatePreset;
  from: string;
  to: string;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (from: string, to: string) => void;
}

const RangeContext = createContext<RangeContextType | undefined>(undefined);

const STORAGE_KEY = 'crm_global_range_v3';

export const RangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{ preset: DatePreset; from: string; to: string }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.preset && parsed.from && parsed.to) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse range from storage", e);
      }
    }

    // Default: Yearly — covers all data in the current year
    const range = getRangeFromPreset('yearly');
    return { preset: 'yearly', ...range };
  });

  const setPreset = useCallback((preset: DatePreset) => {
    if (preset === 'custom') return; // Should use setCustomRange
    const range = getRangeFromPreset(preset);
    const newState = { preset, ...range };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    const newState = { preset: 'custom' as const, from, to };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  return (
    <RangeContext.Provider value={{ ...state, setPreset, setCustomRange }}>
      {children}
    </RangeContext.Provider>
  );
};

export const useRange = () => {
  const context = useContext(RangeContext);
  if (!context) {
    throw new Error('useRange must be used within a RangeProvider');
  }
  return context;
};

// Legacy shim for existing code
export const useDashboardRange = useRange;
