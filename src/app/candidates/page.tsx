'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  UserPlus,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { StageFilter, FilterStage } from '@/components/StageFilter';
import { CandidateCard, CandidateCardData } from '@/components/CandidateCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface CandidateApiResponse {
  candidates: (CandidateCardData & {
    resumeLink?: string | null;
    notes?: string | null;
    updatedAt?: string | Date;
  })[];
  total: number;
  page: number;
  totalPages: number;
}

interface DashboardApiResponse {
  totalCandidates: number;
  byStage: { stage: string; count: number }[];
}

function CandidateListContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read state from URL search params
  const queryParam = searchParams.get('q') || '';
  const stageParam = (searchParams.get('stage') as FilterStage) || 'All';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limitParam = 12;

  // Local state
  const [candidates, setCandidates] = useState<CandidateCardData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [stageCounts, setStageCounts] = useState<Partial<Record<FilterStage | string, number>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to update URL params
  const updateQueryParams = useCallback(
    (updates: { q?: string; stage?: string; page?: number }) => {
      const current = new URLSearchParams(searchParams.toString());

      if (updates.q !== undefined) {
        if (updates.q) {
          current.set('q', updates.q);
        } else {
          current.delete('q');
        }
      }

      if (updates.stage !== undefined) {
        if (updates.stage && updates.stage !== 'All') {
          current.set('stage', updates.stage);
        } else {
          current.delete('stage');
        }
      }

      if (updates.page !== undefined) {
        if (updates.page > 1) {
          current.set('page', updates.page.toString());
        } else {
          current.delete('page');
        }
      }

      const queryString = current.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch candidates from API
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (queryParam) params.set('q', queryParam);
      if (stageParam && stageParam !== 'All') params.set('stage', stageParam);
      params.set('page', pageParam.toString());
      params.set('limit', limitParam.toString());

      const res = await fetch(`/api/candidates?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load candidates (status: ${res.status})`);
      }

      const data: CandidateApiResponse = await res.json();
      setCandidates(data.candidates || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load candidates. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [queryParam, stageParam, pageParam, limitParam]);

  // Fetch stage counts from dashboard API for StageFilter count badges
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data: DashboardApiResponse = await res.json();
        const counts: Partial<Record<FilterStage | string, number>> = {
          All: data.totalCandidates || 0,
        };
        if (Array.isArray(data.byStage)) {
          data.byStage.forEach((item) => {
            counts[item.stage] = item.count;
          });
        }
        setStageCounts(counts);
      }
    } catch {
      // Non-critical, ignore error
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Handlers
  const handleSearchChange = (value: string) => {
    updateQueryParams({ q: value, page: 1 });
  };

  const handleStageChange = (stage: FilterStage) => {
    updateQueryParams({ stage, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    updateQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  // Determine pagination bounds for "Showing X to Y of Z"
  const startItem = total === 0 ? 0 : (pageParam - 1) * limitParam + 1;
  const endItem = Math.min(pageParam * limitParam, total);
  const isFiltered = Boolean(queryParam || (stageParam && stageParam !== 'All'));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Candidates
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {total} {total === 1 ? 'candidate' : 'candidates'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and track candidates across recruitment stages.
          </p>
        </div>

        <Link
          href="/candidates/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Candidate</span>
        </Link>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SearchBar
            onChange={handleSearchChange}
            defaultValue={queryParam}
            placeholder="Search by name, email, or position..."
            className="w-full md:max-w-md"
          />

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors self-start md:self-auto"
            >
              <FilterX className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* Stage Filter Pills */}
        <div className="pt-2 border-t border-slate-100">
          <StageFilter
            activeStage={stageParam}
            onFilter={handleStageChange}
            counts={stageCounts}
          />
        </div>
      </div>

      {/* Results Count & Status Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          {isLoading ? (
            <span>Loading candidates...</span>
          ) : total > 0 ? (
            <span>
              Showing <span className="font-medium text-slate-800">{startItem}</span> to{' '}
              <span className="font-medium text-slate-800">{endItem}</span> of{' '}
              <span className="font-medium text-slate-800">{total}</span> candidates
              {isFiltered && ' (filtered)'}
            </span>
          ) : (
            <span>0 candidates found</span>
          )}
        </div>

        {queryParam && (
          <div className="hidden sm:inline-flex items-center gap-1.5 text-slate-500">
            <span>Query:</span>
            <span className="font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              &quot;{queryParam}&quot;
            </span>
          </div>
        )}
      </div>

      {/* Content State: Loading, Error, Empty, or Candidates Grid */}
      {isLoading ? (
        <div className="min-h-[350px] flex items-center justify-center bg-white rounded-2xl border border-slate-200 p-12">
          <LoadingSpinner size="lg" text="Loading candidates..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-red-900 mb-1">
            Error loading candidates
          </h3>
          <p className="text-sm text-red-600 max-w-md mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchCandidates()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : candidates.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={FilterX}
            title="No candidates match your criteria"
            description="Try modifying your search keywords or switching stage filters to find what you're looking for."
            action={{
              label: 'Clear All Filters',
              onClick: handleResetFilters,
            }}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No candidates yet"
            description="Your talent pipeline is currently empty. Start adding candidates to screen and interview top talent."
            action={{
              label: 'Add First Candidate',
              href: '/candidates/new',
              icon: UserPlus,
            }}
          />
        )
      ) : (
        <>
          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Page <span className="font-medium text-slate-900">{pageParam}</span> of{' '}
                <span className="font-medium text-slate-900">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(pageParam - 1)}
                  disabled={pageParam <= 1}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Numeric Page Buttons */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show current, first, last, and immediate neighbours
                      return (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - pageParam) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const isGap = prevPage && p - prevPage > 1;

                      return (
                        <React.Fragment key={p}>
                          {isGap && (
                            <span className="px-2 py-1 text-slate-400 text-xs">
                              ...
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`min-w-9 h-9 px-2 text-sm font-medium rounded-xl transition-colors ${
                              p === pageParam
                                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(pageParam + 1)}
                  disabled={pageParam >= totalPages}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading candidates..." />
        </div>
      }
    >
      <CandidateListContent />
    </Suspense>
  );
}
