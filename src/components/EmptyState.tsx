import React from 'react';
import Link from 'next/link';
import { Inbox, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction | React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: CustomIcon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  // Render icon
  const renderIcon = () => {
    if (!CustomIcon) {
      return <Inbox className="w-7 h-7 text-slate-400" />;
    }
    if (React.isValidElement(CustomIcon)) {
      return CustomIcon;
    }
    const IconComponent = CustomIcon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-7 h-7 text-slate-400" />;
  };

  // Render action
  const renderAction = () => {
    if (!action) return null;

    if (React.isValidElement(action)) {
      return <div className="mt-5">{action}</div>;
    }

    const actionObj = action as EmptyStateAction;
    const ActionIcon = actionObj.icon;

    const buttonClasses =
      'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

    if (actionObj.href) {
      return (
        <div className="mt-5">
          <Link href={actionObj.href} className={buttonClasses}>
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            <span>{actionObj.label}</span>
          </Link>
        </div>
      );
    }

    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={actionObj.onClick}
          className={buttonClasses}
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          <span>{actionObj.label}</span>
        </button>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-dashed border-slate-200/90 shadow-2xs',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 ring-8 ring-slate-50/50">
        {renderIcon()}
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}

      {renderAction()}
    </div>
  );
}

export default EmptyState;
