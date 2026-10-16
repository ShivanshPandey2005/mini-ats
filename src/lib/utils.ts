import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'] as const;
export type Stage = typeof STAGES[number];

export const STAGE_COLORS: Record<Stage, string> = {
  Applied: 'bg-blue-100 text-blue-800 border-blue-200',
  Screening: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Interview: 'bg-purple-100 text-purple-800 border-purple-200',
  Offer: 'bg-orange-100 text-orange-800 border-orange-200',
  Hired: 'bg-green-100 text-green-800 border-green-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

export const STAGE_DOT_COLORS: Record<Stage, string> = {
  Applied: 'bg-blue-500',
  Screening: 'bg-yellow-500',
  Interview: 'bg-purple-500',
  Offer: 'bg-orange-500',
  Hired: 'bg-green-500',
  Rejected: 'bg-red-500',
};

export function isValidStage(stage: unknown): stage is Stage {
  return typeof stage === 'string' && (STAGES as readonly string[]).includes(stage);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}
