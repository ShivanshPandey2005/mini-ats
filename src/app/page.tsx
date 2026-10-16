'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  Activity,
  ArrowRight,
  Briefcase,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import {
  cn,
  STAGES,
  STAGE_COLORS,
  STAGE_DOT_COLORS,
  type Stage,
} from '@/lib/utils';

// Hex color codes specified for the funnel chart bars
const STAGE_HEX_COLORS: Record<Stage, string> = {
  Applied: '#3B82F6',
  Screening: '#EAB308',
  Interview: '#A855F7',
  Offer: '#F97316',
  Hired: '#22C55E',
  Rejected: '#EF4444',
};

interface CandidateSummary {
  id: string | number;
  name: string;
  position: string;
}

interface RecentActivityItem {
  id: string | number;
  fromStage: string;
  toStage: string;
  changedAt: string;
  candidate: CandidateSummary;
}

interface StageCount {
  stage: string;
  count: number;
}

interface PositionCount {
  position: string;
  count: number;
}

interface DashboardData {
  totalCandidates: number;
  byStage: StageCount[];
  recentActivity: RecentActivityItem[];
  byPosition: PositionCount[];
  thisWeekCount: number;
  thisMonthCount: number;
}

const POSITION_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

// Custom Tooltip for Funnel Bar Chart
interface CustomBarTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      stage: string;
      count: number;
      fill: string;
    };
  }>;
}

function CustomBarTooltip({ active, payload }: CustomBarTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white px-3.5 py-2.5 rounded-lg shadow-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: item.fill }}
          />
          <span className="font-semibold text-slate-800">{item.stage}</span>
        </div>
        <p className="text-slate-600">
          Candidates:{' '}
          <span className="font-bold text-slate-900">{item.count}</span>
        </p>
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Position Pie Chart
interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      fill: string;
    };
  }>;
}

function CustomPieTooltip({ active, payload }: CustomPieTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white px-3.5 py-2.5 rounded-lg shadow-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: item.payload.fill }}
          />
          <span className="font-semibold text-slate-800">{item.name}</span>
        </div>
        <p className="text-slate-600">
          Candidates:{' '}
          <span className="font-bold text-slate-900">{item.value}</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch dashboard data (HTTP ${res.status}: ${res.statusText})`
        );
      }

      const json: DashboardData = await res.json();
      setData(json);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Safe active pipeline calculation (excludes Hired and Rejected)
  const activePipelineCount = useMemo(() => {
    if (!data?.byStage) return 0;
    return data.byStage
      .filter((item) => {
        const stageName = (item.stage || '').trim().toLowerCase();
        return stageName !== 'hired' && stageName !== 'rejected';
      })
      .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  }, [data]);

  // Stage funnel chart data formatted in canonical order with hex colors
  const stageChartData = useMemo(() => {
    return STAGES.map((stage) => {
      const stageLower = stage.toLowerCase();
      const match = data?.byStage?.find(
        (s) => (s.stage || '').trim().toLowerCase() === stageLower
      );
      return {
        stage,
        count: match ? Number(match.count) || 0 : 0,
        fill: STAGE_HEX_COLORS[stage] || '#3B82F6',
      };
    });
  }, [data]);

  // Position chart data with distinct color mapping
  const positionChartData = useMemo(() => {
    if (!data?.byPosition || data.byPosition.length === 0) return [];
    return data.byPosition.map((item, idx) => ({
      name: item.position || 'Unassigned',
      value: Number(item.count) || 0,
      fill: POSITION_PALETTE[idx % POSITION_PALETTE.length],
    }));
  }, [data]);

  // Recent activity entries limited to last 10
  const recentActivities = useMemo(() => {
    if (!data?.recentActivity) return [];
    return data.recentActivity.slice(0, 10);
  }, [data]);

  // Current formatted date
  const currentDateFormatted = useMemo(() => {
    if (!isMounted) return '';
    try {
      return format(new Date(), 'EEEE, MMMM d, yyyy');
    } catch {
      return new Date().toLocaleDateString();
    }
  }, [isMounted]);

  // Formatter for relative timestamps
  const formatTimeAgo = (dateStr: string) => {
    if (!isMounted || !dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      if (!isValid(date)) return 'Recently';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Overview of your hiring pipeline
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-medium text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{currentDateFormatted || 'Loading date...'}</span>
            </div>

            <button
              onClick={() => fetchDashboardData()}
              disabled={isLoading}
              title="Refresh dashboard data"
              aria-label="Refresh dashboard data"
              className={cn(
                'inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50'
              )}
            >
              <RefreshCw
                className={cn('w-4 h-4', isLoading && 'animate-spin text-blue-600')}
              />
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">
                Error loading dashboard
              </h3>
              <p className="mt-0.5 text-xs text-red-700">{error}</p>
            </div>
            <button
              onClick={() => fetchDashboardData()}
              className="text-xs font-semibold text-red-800 hover:text-red-900 underline shrink-0 px-2 py-1"
            >
              Try again
            </button>
          </div>
        )}

        {/* 2. Stats Cards Row (4 cards in a grid: 1 col mobile, 2 col tablet, 4 col desktop) */}
        <section aria-label="Key Statistics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Candidates (Blue Accent) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Total Candidates
                </span>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading && !data ? (
                  <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {data?.totalCandidates ?? 0}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  All active & historical applicants
                </p>
              </div>
            </div>

            {/* Card 2: This Week (Green Accent) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  This Week
                </span>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading && !data ? (
                  <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {data?.thisWeekCount ?? 0}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  New applications in last 7 days
                </p>
              </div>
            </div>

            {/* Card 3: This Month (Purple Accent) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  This Month
                </span>
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading && !data ? (
                  <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {data?.thisMonthCount ?? 0}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  New applications this month
                </p>
              </div>
            </div>

            {/* Card 4: Active Pipeline (Orange Accent) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Active Pipeline
                </span>
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading && !data ? (
                  <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {activePipelineCount}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  In Screening, Interview or Offer
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 & 4. Charts Grid (Funnel Chart & Positions Breakdown) */}
        <section aria-label="Visual Analytics">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 3. Pipeline Funnel Chart (Recharts BarChart) */}
            <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Pipeline Funnel
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Distribution of candidates across all stages
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    6 Stages
                  </span>
                </div>

                <div className="w-full h-[320px] pt-4 min-w-0">
                  {isLoading && !data ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-slate-50/60 rounded-lg">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-400">Loading funnel chart...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stageChartData}
                        margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F1F5F9"
                        />
                        <XAxis
                          dataKey="stage"
                          tickLine={false}
                          axisLine={{ stroke: '#E2E8F0' }}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                          interval={0}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={{ stroke: '#E2E8F0' }}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                          label={{
                            value: 'Candidates',
                            angle: -90,
                            position: 'insideLeft',
                            fill: '#94A3B8',
                            fontSize: 12,
                            offset: 15,
                          }}
                        />
                        <Tooltip
                          content={<CustomBarTooltip />}
                          cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        >
                          {stageChartData.map((entry) => (
                            <Cell key={`bar-${entry.stage}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Stage legend tags below chart */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-4 mt-2 border-t border-slate-100 text-center">
                {stageChartData.map((st) => (
                  <div key={st.stage} className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: st.fill }}
                      />
                      <span className="text-[11px] font-medium text-slate-600 truncate">
                        {st.stage}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {st.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Positions Breakdown (Recharts PieChart) */}
            <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-purple-600" />
                      Positions Breakdown
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Candidate distribution by job title
                    </p>
                  </div>
                  {positionChartData.length > 0 && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {positionChartData.length} Roles
                    </span>
                  )}
                </div>

                <div className="w-full h-[320px] min-w-0 flex items-center justify-center">
                  {isLoading && !data ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-slate-50/60 rounded-lg">
                      <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-400">Loading position breakdown...</p>
                    </div>
                  ) : positionChartData.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-medium text-slate-500">
                        No positions data found
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Add candidates with position roles to see distribution.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={positionChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {positionChartData.map((entry) => (
                            <Cell key={`pie-${entry.name}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: '11px',
                            paddingTop: '10px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Bottom total roles summary */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Unique open positions</span>
                <span className="font-semibold text-slate-800">
                  {positionChartData.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Recent Activity Feed */}
        <section aria-label="Recent Activity">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Recent Activity
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest candidate stage transitions and hiring progress
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Latest {recentActivities.length} updates
              </span>
            </div>

            <div className="p-6">
              {isLoading && !data ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4 items-center animate-pulse">
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 bg-slate-200 rounded" />
                        <div className="h-3 w-1/4 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-500">
                    No stage activity yet
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Stage changes made in the pipeline will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6">
                  {/* Continuous Timeline Connecting Line */}
                  <div
                    className="absolute left-2.5 top-3 bottom-4 w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />

                  {recentActivities.map((act, index) => {
                    const toStageKey = (act.toStage in STAGE_DOT_COLORS
                      ? act.toStage
                      : 'Applied') as Stage;
                    const fromStageKey = (act.fromStage in STAGE_COLORS
                      ? act.fromStage
                      : 'Applied') as Stage;

                    const dotColor =
                      STAGE_DOT_COLORS[toStageKey] || 'bg-blue-500';
                    const targetBadgeStyle =
                      STAGE_COLORS[toStageKey] ||
                      'bg-blue-100 text-blue-800 border-blue-200';
                    const sourceBadgeStyle =
                      STAGE_COLORS[fromStageKey] ||
                      'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={act.id || `${act.candidate?.id}-${index}`}
                        className="relative flex items-start group"
                      >
                        {/* Timeline Dot */}
                        <div
                          className={cn(
                            'absolute -left-6 top-1.5 w-3 h-3 rounded-full ring-4 ring-white shadow-xs transition-transform group-hover:scale-125',
                            dotColor
                          )}
                          aria-hidden="true"
                        />

                        {/* Activity Card Row */}
                        <div className="flex-1 ml-2 bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            {/* Candidate Info */}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">
                                  {act.candidate?.name || 'Unknown Candidate'}
                                </span>
                                {act.candidate?.position && (
                                  <span className="inline-flex items-center text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    <Briefcase className="w-3 h-3 mr-1 text-slate-400" />
                                    {act.candidate.position}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Timestamp */}
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {formatTimeAgo(act.changedAt)}
                            </span>
                          </div>

                          {/* Stage Transition */}
                          <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs">
                            <span className="text-slate-500">Moved from</span>
                            <span
                              className={cn(
                                'font-medium px-2 py-0.5 rounded border',
                                sourceBadgeStyle
                              )}
                            >
                              {act.fromStage || 'Applied'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span
                              className={cn(
                                'font-semibold px-2 py-0.5 rounded border',
                                targetBadgeStyle
                              )}
                            >
                              {act.toStage}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
