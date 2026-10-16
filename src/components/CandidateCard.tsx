'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { StageBadge } from './StageBadge';
import { Stage, formatDate, cn } from '@/lib/utils';

export interface CandidateCardData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  stage: Stage | string;
  createdAt?: string | Date;
  appliedDate?: string | Date;
  notesCount?: number;
}

export interface CandidateCardProps {
  candidate: CandidateCardData;
  onClick?: () => void;
  className?: string;
}

export function CandidateCard({
  candidate,
  onClick,
  className,
}: CandidateCardProps) {
  const dateToFormat = candidate.appliedDate || candidate.createdAt;
  const formattedDate = dateToFormat ? formatDate(dateToFormat) : null;

  // Extract candidate initials for avatar
  const initials = candidate.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <Link
      href={`/candidates/${candidate.id}`}
      onClick={onClick}
      className={cn(
        'group block bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs',
        'hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5',
        'transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
    >
      {/* Top Header: Avatar + Name + Position & Stage Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {initials || 'C'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-base truncate group-hover:text-blue-600 transition-colors">
              {candidate.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{candidate.position}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <StageBadge stage={candidate.stage} size="sm" />
        </div>
      </div>

      {/* Contact Details */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate hover:text-slate-900">{candidate.email}</span>
        </div>
        {candidate.phone && (
          <div className="flex items-center gap-2 truncate">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{candidate.phone}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Date Applied & Action Hint */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate ? `Applied ${formattedDate}` : 'Recently applied'}</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default CandidateCard;
