'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Calendar,
  Briefcase,
  RefreshCw,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  ListFilter,
  ArrowRight,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import {
  cn,
  STAGES,
  STAGE_COLORS,
  STAGE_DOT_COLORS,
  type Stage,
} from '@/lib/utils';

// Top border colors for column headers
const STAGE_TOP_BORDER_COLORS: Record<Stage, string> = {
  Applied: 'border-t-blue-500',
  Screening: 'border-t-yellow-500',
  Interview: 'border-t-purple-500',
  Offer: 'border-t-orange-500',
  Hired: 'border-t-green-500',
  Rejected: 'border-t-red-500',
};

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  stage: Stage | string;
  resumeLink?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Format date nicely using date-fns
 */
function formatAppliedDate(dateString?: string | null): string {
  if (!dateString) return 'Recently';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(d)) return 'Recently';
    return format(d, 'MMM d, yyyy');
  } catch {
    return 'Recently';
  }
}

/**
 * Single Draggable/Sortable Candidate Card in Kanban Column
 */
interface KanbanCardProps {
  candidate: Candidate;
  isOverlay?: boolean;
}

function KanbanCard({ candidate, isOverlay = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id,
    data: {
      type: 'Candidate',
      candidate,
      stage: candidate.stage,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedDate = useMemo(
    () => formatAppliedDate(candidate.createdAt),
    [candidate.createdAt]
  );

  const initials = useMemo(() => {
    return (
      candidate.name
        ?.split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || 'C'
    );
  }, [candidate.name]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white rounded-lg border border-slate-200/90 p-3.5 shadow-xs transition-all duration-150 select-none',
        'hover:shadow-md hover:border-slate-300',
        isDragging &&
          'opacity-30 border-dashed border-2 border-blue-400 bg-blue-50/20 shadow-none pointer-events-none',
        isOverlay &&
          'shadow-2xl ring-2 ring-blue-500/40 border-blue-300 scale-[1.02] cursor-grabbing bg-white z-50'
      )}
    >
      {/* Top row: Avatar, Name, and Drag Handle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/candidates/${candidate.id}`}
              onClick={(e) => {
                if (isDragging) e.preventDefault();
              }}
              className="font-semibold text-slate-900 text-sm truncate block hover:text-blue-600 transition-colors"
              title={candidate.name}
            >
              {candidate.name}
            </Link>
          </div>
        </div>

        {/* Draggable Handle */}
        <button
          type="button"
          aria-label="Drag candidate handle"
          {...attributes}
          {...listeners}
          className={cn(
            'p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing focus:outline-none transition-colors touch-none shrink-0',
            isOverlay && 'cursor-grabbing text-slate-700'
          )}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Position */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-2.5 truncate">
        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate" title={candidate.position}>
          {candidate.position}
        </span>
      </div>

      {/* Date applied & Quick details link */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Applied {formattedDate}</span>
        </div>
        <Link
          href={`/candidates/${candidate.id}`}
          className="text-[11px] font-medium text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5"
          onClick={(e) => {
            if (isDragging) e.preventDefault();
          }}
        >
          <span>View</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Droppable Kanban Column for each stage
 */
interface KanbanColumnProps {
  stage: Stage;
  candidates: Candidate[];
}

function KanbanColumn({ stage, candidates }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: {
      type: 'Column',
      stage,
    },
  });

  const candidateIds = useMemo(() => candidates.map((c) => c.id), [candidates]);

  return (
    <div
      className={cn(
        'flex flex-col bg-slate-50 border border-slate-200/90 rounded-xl overflow-hidden min-w-[280px] w-[310px] sm:w-[320px] shrink-0 h-full shadow-xs transition-colors duration-200 border-t-4',
        STAGE_TOP_BORDER_COLORS[stage] || 'border-t-slate-400',
        isOver && 'ring-2 ring-blue-500/40 bg-blue-50/20 border-blue-300 shadow-sm'
      )}
    >
      {/* Column Header */}
      <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full shrink-0',
              STAGE_DOT_COLORS[stage] || 'bg-slate-400'
            )}
          />
          <h3 className="font-semibold text-slate-800 text-sm tracking-tight">{stage}</h3>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-semibold rounded-full border shadow-2xs',
            STAGE_COLORS[stage] || 'bg-slate-100 text-slate-700 border-slate-200'
          )}
        >
          {candidates.length}
        </span>
      </div>

      {/* Candidate Cards Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 overflow-y-auto space-y-3 min-h-[160px] transition-colors',
          isOver && candidates.length === 0 && 'bg-blue-50/40'
        )}
      >
        <SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>
          {candidates.map((candidate) => (
            <KanbanCard key={candidate.id} candidate={candidate} />
          ))}
        </SortableContext>

        {/* Empty state placeholder */}
        {candidates.length === 0 && (
          <div
            className={cn(
              'h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-3 text-center transition-colors',
              isOver
                ? 'border-blue-400 bg-blue-50/60 text-blue-600'
                : 'border-slate-200 text-slate-400'
            )}
          >
            <p className="text-xs font-medium">
              {isOver ? 'Drop candidate here' : 'No candidates'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {isOver ? 'Release to update stage' : 'Drag candidate cards here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton Loader for Pipeline
 */
function PipelineSkeleton() {
  return (
    <div className="flex gap-4 h-full min-w-max pb-2 animate-pulse">
      {STAGES.map((stage) => (
        <div
          key={stage}
          className="flex flex-col bg-slate-50 border border-slate-200/90 rounded-xl overflow-hidden min-w-[280px] w-[310px] sm:w-[320px] shrink-0 h-full border-t-4 border-t-slate-300"
        >
          {/* Header Skeleton */}
          <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <div className="h-4 w-20 bg-slate-200 rounded" />
            </div>
            <div className="h-5 w-7 bg-slate-200 rounded-full" />
          </div>

          {/* Cards Skeleton */}
          <div className="p-3 space-y-3 flex-1 overflow-hidden">
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded pt-2" />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                <div className="h-4 w-28 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-200 rounded pt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const createEmptyColumns = (): Record<Stage, Candidate[]> => ({
  Applied: [],
  Screening: [],
  Interview: [],
  Offer: [],
  Hired: [],
  Rejected: [],
});

/**
 * Main Pipeline Page Component
 */
export default function PipelinePage() {
  const [columns, setColumns] = useState<Record<Stage, Candidate[]>>(() => createEmptyColumns());

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Snapshot refs to allow smooth optimistic updates and rollbacks
  const initialStageRef = useRef<Stage | null>(null);
  const previousColumnsRef = useRef<Record<Stage, Candidate[]> | null>(null);

  // Dnd-kit sensors: Pointer sensor requires 5px drag to differentiate clicks from drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Helper to show temporary toast messages
   */
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToast({ id, message, type });
      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 4000);
    },
    []
  );

  /**
   * Fetch all candidates from GET /api/candidates?limit=100
   */
  const fetchCandidates = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/candidates?limit=100');
        if (!response.ok) {
          throw new Error(`Failed to load candidates (${response.status})`);
        }
        const data = await response.json();
        const candidateList: Candidate[] = Array.isArray(data.candidates)
          ? data.candidates
          : [];

        // Group candidates into stages
        const grouped = createEmptyColumns();

        for (const candidate of candidateList) {
          const stage = candidate.stage as Stage;
          if (grouped[stage]) {
            grouped[stage].push(candidate);
          } else {
            // Default fallback if unknown stage
            grouped['Applied'].push(candidate);
          }
        }

        setColumns(grouped);
      } catch (err: unknown) {
        console.error('Error fetching pipeline candidates:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch candidates';
        setError(errorMessage);
      } finally {
        if (showLoadingSpinner) setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchCandidates(true);
  }, [fetchCandidates]);

  /**
   * Find which stage column contains a given item ID (stage name or candidate id)
   */
  const findColumn = useCallback(
    (id: string, currentColumns: Record<Stage, Candidate[]>): Stage | null => {
      if (STAGES.includes(id as Stage)) {
        return id as Stage;
      }
      for (const stage of STAGES) {
        if (currentColumns[stage]?.some((c) => c.id === id)) {
          return stage;
        }
      }
      return null;
    },
    []
  );

  /**
   * Collision Detection: prefers pointerWithin, then rectIntersection, falls back to closestCorners
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    return closestCorners(args);
  }, []);

  /**
   * Drag Start: save initial stage and state snapshot
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeId = String(active.id);
      const stage = findColumn(activeId, columns);

      if (stage) {
        initialStageRef.current = stage;
        previousColumnsRef.current = Object.fromEntries(
          Object.entries(columns).map(([k, v]) => [k, [...v]])
        ) as Record<Stage, Candidate[]>;

        const candidate = columns[stage]?.find((c) => c.id === activeId);
        if (candidate) {
          setActiveCandidate(candidate);
        }
      }
    },
    [columns, findColumn]
  );

  /**
   * Drag Over: Move candidate live between columns for immediate feedback
   */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId === overId) return;

      const activeColumn = findColumn(activeId, columns);
      const overColumn = findColumn(overId, columns);

      if (!activeColumn || !overColumn || activeColumn === overColumn) {
        return;
      }

      setColumns((prev) => {
        const activeItems = [...(prev[activeColumn] || [])];
        const overItems = [...(prev[overColumn] || [])];

        const activeIndex = activeItems.findIndex((c) => c.id === activeId);
        if (activeIndex === -1) return prev;

        const [movedCandidate] = activeItems.splice(activeIndex, 1);
        const updatedCandidate: Candidate = { ...movedCandidate, stage: overColumn };

        // Determine where to insert in destination column
        const overIndex = overItems.findIndex((c) => c.id === overId);
        if (overIndex >= 0) {
          overItems.splice(overIndex, 0, updatedCandidate);
        } else {
          overItems.push(updatedCandidate);
        }

        return {
          ...prev,
          [activeColumn]: activeItems,
          [overColumn]: overItems,
        };
      });
    },
    [columns, findColumn]
  );

  /**
   * Drag End: Detect stage change and commit to server via PUT /api/candidates/[id]/stage
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = String(active.id);
      const startStage = initialStageRef.current;
      const previousState = previousColumnsRef.current;

      setActiveCandidate(null);
      initialStageRef.current = null;
      previousColumnsRef.current = null;

      if (!over) {
        if (previousState) setColumns(previousState);
        return;
      }

      const overId = String(over.id);
      const finalColumn = findColumn(activeId, columns);

      // 1. Stage Changed: Call API
      if (finalColumn && startStage && finalColumn !== startStage) {
        try {
          setIsUpdating(true);
          const response = await fetch(`/api/candidates/${activeId}/stage`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stage: finalColumn,
              notes: `Moved from ${startStage} to ${finalColumn} via Pipeline Board`,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to update stage (${response.status})`);
          }

          showToast(`Moved to ${finalColumn}`, 'success');

          // Refresh in background to sync server state
          fetchCandidates(false);
        } catch (err: unknown) {
          console.error('Error updating candidate stage:', err);
          // Rollback to snapshot on error
          if (previousState) {
            setColumns(previousState);
          }
          const errorMessage = err instanceof Error ? err.message : 'Failed to update stage. Reverting.';
          showToast(errorMessage, 'error');
        } finally {
          setIsUpdating(false);
        }
        return;
      }

      // 2. Reordered inside the same column
      if (finalColumn && startStage && finalColumn === startStage) {
        const colItems = columns[finalColumn] || [];
        const oldIndex = colItems.findIndex((c) => c.id === activeId);
        const newIndex = colItems.findIndex((c) => c.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          setColumns((prev) => ({
            ...prev,
            [finalColumn]: arrayMove(prev[finalColumn], oldIndex, newIndex),
          }));
        }
      }
    },
    [columns, fetchCandidates, findColumn, showToast]
  );

  /**
   * Drag Cancelled
   */
  const handleDragCancel = useCallback(() => {
    if (previousColumnsRef.current) {
      setColumns(previousColumnsRef.current);
    }
    setActiveCandidate(null);
    initialStageRef.current = null;
    previousColumnsRef.current = null;
  }, []);

  /**
   * Total Candidates count
   */
  const totalCandidates = useMemo(() => {
    return Object.values(columns).reduce((acc, list) => acc + list.length, 0);
  }, [columns]);

  /**
   * Filtered columns if search query is entered
   */
  const displayColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const q = searchQuery.toLowerCase().trim();
    const result = createEmptyColumns();

    for (const stage of STAGES) {
      result[stage] = (columns[stage] || []).filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [columns, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-5.5rem)] md:h-[calc(100vh-5rem)]">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Pipeline Board
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {totalCandidates} {totalCandidates === 1 ? 'candidate' : 'candidates'}
            </span>
            {isUpdating && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Drag candidates across stages to seamlessly track their hiring progression.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchCandidates(true)}
            disabled={loading || isUpdating}
            title="Refresh candidates"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn('w-4 h-4', (loading || isUpdating) && 'animate-spin text-blue-600')}
            />
          </button>

          {/* Link to List View */}
          <Link
            href="/candidates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ListFilter className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">List View</span>
          </Link>

          {/* Add Candidate Button */}
          <Link
            href="/candidates/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </Link>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs sm:text-sm text-red-700 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchCandidates(true)}
            className="text-xs font-semibold underline hover:no-underline ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200',
            toast.type === 'success' && 'bg-emerald-50 text-emerald-900 border-emerald-200',
            toast.type === 'error' && 'bg-rose-50 text-rose-900 border-rose-200',
            toast.type === 'info' && 'bg-slate-900 text-white border-slate-800'
          )}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Kanban Board Container with Horizontal Scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 select-none">
        {loading ? (
          <PipelineSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-4 sm:gap-5 h-full min-w-max pb-2">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  candidates={displayColumns[stage] || []}
                />
              ))}
            </div>

            {/* Drag Overlay: Shows lifted candidate card with shadow and slight tilt */}
            <DragOverlay dropAnimation={null}>
              {activeCandidate ? (
                <div className="w-[300px] pointer-events-none">
                  <KanbanCard candidate={activeCandidate} isOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
