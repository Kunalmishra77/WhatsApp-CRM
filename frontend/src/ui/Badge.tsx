import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'danger' | 'warning' | 'info' | 'zinc' | 'success';
  size?: 'xs' | 'sm';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  className, 
  variant = 'teal', 
  size = 'xs',
  ...props 
}) => {
  const variants = {
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    zinc: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  };

  const sizes = {
    xs: "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
    sm: "px-3 py-1 text-xs font-bold",
  };

  return (
    <span 
      className={cn(
        "rounded-md border font-sans inline-flex items-center justify-center transition-all duration-300",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
