import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { DashboardRangeProvider } from '../state/dashboardRangeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardRangeProvider>
        {children}
        <Toaster position="top-right" richColors theme="system" />
      </DashboardRangeProvider>
    </QueryClientProvider>
  );
};
