import React from 'react';
import { cn } from '../lib/utils'; // I'll need to recreate utils/cn too

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'panel' | 'raised';
  innerGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'panel', 
  innerGlow = true,
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "rounded-[1.5rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden transition-all duration-300",
        variant === 'glass' && "bg-white/40 dark:bg-black/40 backdrop-blur-xl",
        variant === 'panel' && "bg-white/70 dark:bg-[#0f0f12]/70",
        variant === 'raised' && "bg-white dark:bg-[#15151a] shadow-premium",
        innerGlow && "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
