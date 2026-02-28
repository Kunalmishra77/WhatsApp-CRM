import React from 'react';
import { cn } from '../lib/utils';

interface ChartContainerProps {
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  children, 
  height = 300, 
  className 
}) => {
  return (
    <div 
      className={cn("w-full relative", className)} 
      style={{ height }}
    >
      {children}
    </div>
  );
};
