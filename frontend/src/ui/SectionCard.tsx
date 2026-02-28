import React from 'react';
import { Card } from './Card';
import { cn } from '../lib/utils';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  overflowHidden?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  className,
  headerActions,
  overflowHidden = true
}) => {
  return (
    <Card overflowHidden={overflowHidden} className={cn("p-8", className)}>
      {(title || subtitle || headerActions) && (
        <div className="flex items-center justify-between mb-8">
          <div>
            {title && (
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm font-medium text-zinc-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      {children}
    </Card>
  );
};
