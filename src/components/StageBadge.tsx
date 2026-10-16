import React from 'react';
import {
  Stage,
  STAGE_COLORS,
  STAGE_DOT_COLORS,
  isValidStage,
  cn,
} from '@/lib/utils';

export interface StageBadgeProps {
  stage: Stage | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function StageBadge({
  stage,
  size = 'md',
  showDot = true,
  className,
}: StageBadgeProps) {
  const isKnown = isValidStage(stage);
  const colorClass = isKnown
    ? STAGE_COLORS[stage]
    : 'bg-slate-100 text-slate-700 border-slate-200';
  const dotColorClass = isKnown
    ? STAGE_DOT_COLORS[stage]
    : 'bg-slate-400';

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const dotSizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-2xs whitespace-nowrap transition-colors',
        sizeStyles[size],
        colorClass,
        className
      )}
    >
      {showDot && (
        <span
          className={cn('rounded-full shrink-0', dotSizeStyles[size], dotColorClass)}
          aria-hidden="true"
        />
      )}
      <span>{stage}</span>
    </span>
  );
}

export default StageBadge;
