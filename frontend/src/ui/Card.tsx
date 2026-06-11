import React from 'react';
import { cn } from '../lib/utils'; // I'll need to recreate utils/cn too

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'panel' | 'raised';
  innerGlow?: boolean;
  overflowHidden?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'panel', 
  innerGlow = true,
  overflowHidden = true,
  ...props 
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        "border-black/[0.06] dark:border-white/[0.08]",
        overflowHidden && "overflow-hidden",
        variant === 'glass' && "bg-white/75 dark:bg-[#1c1c1e]/75 backdrop-blur-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]",
        variant === 'panel' && "bg-white dark:bg-[#1c1c1e] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]",
        variant === 'raised' && "bg-white dark:bg-[#2c2c2e] shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.06)]",
        innerGlow && "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_4px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
