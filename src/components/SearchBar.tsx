'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  onChange: (value: string) => void;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchBar({
  onChange,
  placeholder = 'Search candidates by name, email, or role...',
  defaultValue = '',
  value: controlledValue,
  className,
  debounceMs = 300,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(
    controlledValue !== undefined ? controlledValue : defaultValue
  );
  const isFirstRender = useRef(true);

  // Sync with controlled value if provided
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounced callback
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative flex items-center w-full max-w-md', className)}>
      <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-slate-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs hover:border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none transition-all duration-150"
      />

      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
