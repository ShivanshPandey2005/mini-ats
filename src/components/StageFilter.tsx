'use client';

import React from 'react';
import { STAGES, Stage, STAGE_DOT_COLORS, cn } from '@/lib/utils';

export type FilterStage = Stage | 'All';

export interface StageFilterProps {
  activeStage: FilterStage | string;
  onFilter: (stage: FilterStage) => void;
  counts?: Partial<Record<FilterStage | string, number>>;
  className?: string;
}

export function StageFilter({
  activeStage = 'All',
  onFilter,
  counts,
  className,
}: StageFilterProps) {
  const options: FilterStage[] = ['All', ...STAGES];

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1',
        className
      )}
      role="tablist"
      aria-label="Filter candidates by stage"
    >
      {options.map((stage) => {
        const isActive = activeStage === stage;
        const count = counts ? counts[stage] : undefined;
        const dotColor = stage !== 'All' ? STAGE_DOT_COLORS[stage as Stage] : null;

        return (
          <button
            key={stage}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilter(stage)}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 border select-none shrink-0',
              isActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            {dotColor && (
              <span
                className={cn('w-2 h-2 rounded-full shrink-0', dotColor)}
                aria-hidden="true"
              />
            )}
            <span>{stage === 'All' ? 'All Stages' : stage}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-semibold',
                  isActive
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default StageFilter;
