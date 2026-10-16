import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = 'md',
  text,
  className,
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2
        className={cn('animate-spin text-blue-600', sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-slate-500 font-medium animate-pulse">{text}</p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] w-full flex items-center justify-center p-8">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
