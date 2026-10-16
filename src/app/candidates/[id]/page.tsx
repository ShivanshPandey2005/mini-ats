'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  ExternalLink,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Check,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GitCommit,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { StageBadge } from '@/components/StageBadge';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { STAGES, Stage, STAGE_DOT_COLORS, formatDate, cn } from '@/lib/utils';

interface StageHistoryItem {
  id: string;
  candidateId: string;
  fromStage: string;
  toStage: string;
  notes?: string | null;
  changedAt: string | Date;
}

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  resumeLink?: string | null;
  notes?: string | null;
  stage: Stage | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  stageHistory: StageHistoryItem[];
}

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  resumeLink: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  position?: string;
  resumeLink?: string;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export default function CandidateDetailPage({
  params,
}: {
  params?: { id: string };
}) {
  const router = useRouter();
  const urlParams = useParams();
  const candidateId = params?.id || (urlParams?.id as string);

  // Core candidate state
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    resumeLink: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Stage change modal / dropdown state
  const [isStageModalOpen, setIsStageModalOpen] = useState<boolean>(false);
  const [targetStage, setTargetStage] = useState<Stage>('Applied');
  const [stageNotes, setStageNotes] = useState<string>('');
  const [isUpdatingStage, setIsUpdatingStage] = useState<boolean>(false);

  // Feedback toast
  const [toast, setToast] = useState<ToastState | null>(null);

  // Fetch candidate details
  const fetchCandidate = useCallback(async () => {
    if (!candidateId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/candidates/${candidateId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Candidate not found');
        }
        throw new Error(`Failed to load candidate (status: ${res.status})`);
      }

      const data: CandidateDetail = await res.json();
      setCandidate(data);
      setEditFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        position: data.position || '',
        resumeLink: data.resumeLink || '',
        notes: data.notes || '',
      });
      setTargetStage((data.stage as Stage) || 'Applied');
    } catch (err: any) {
      console.error('Error fetching candidate:', err);
      setError(err?.message || 'Failed to load candidate details.');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // Format timestamp helper
  const formatDateTime = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  };

  // Toggle edit mode
  const handleStartEdit = () => {
    if (!candidate) return;
    setEditFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      position: candidate.position,
      resumeLink: candidate.resumeLink || '',
      notes: candidate.notes || '',
    });
    setEditErrors({});
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (!candidate) return;
    setEditFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      position: candidate.position,
      resumeLink: candidate.resumeLink || '',
      notes: candidate.notes || '',
    });
    setEditErrors({});
    setIsEditMode(false);
  };

  // Validate edit form
  const validateEditForm = (): boolean => {
    const errors: FormErrors = {};

    if (!editFormData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!editFormData.email.trim()) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editFormData.email.trim())) {
        errors.email = 'Please provide a valid email address';
      }
    }

    if (!editFormData.position.trim()) {
      errors.position = 'Position is required';
    }

    if (editFormData.resumeLink.trim()) {
      try {
        const url = new URL(editFormData.resumeLink.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.resumeLink = 'URL must start with http:// or https://';
        }
      } catch {
        errors.resumeLink = 'Please provide a valid URL';
      }
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save inline edits
  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    setIsSaving(true);
    setToast(null);

    try {
      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
        phone: editFormData.phone.trim() || null,
        position: editFormData.position.trim(),
        resumeLink: editFormData.resumeLink.trim() || null,
        notes: editFormData.notes.trim() || null,
      };

      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update candidate details');
      }

      setCandidate(data);
      setIsEditMode(false);
      setToast({
        type: 'success',
        message: 'Candidate profile updated successfully',
      });
    } catch (err: any) {
      console.error('Error updating candidate:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to save changes. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle stage change submission
  const handleUpdateStage = async () => {
    if (!candidate) return;

    setIsUpdatingStage(true);
    setToast(null);

    try {
      const payload = {
        stage: targetStage,
        notes: stageNotes.trim() || null,
      };

      const res = await fetch(`/api/candidates/${candidateId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update stage');
      }

      setCandidate(data);
      setIsStageModalOpen(false);
      setStageNotes('');
      setToast({
        type: 'success',
        message: `Stage transitioned to ${targetStage}`,
      });
    } catch (err: any) {
      console.error('Error changing stage:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to update stage',
      });
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Handle candidate deletion
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setToast(null);

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete candidate');
      }

      setIsDeleteModalOpen(false);
      setToast({
        type: 'success',
        message: 'Candidate deleted successfully. Redirecting...',
      });

      setTimeout(() => {
        router.push('/candidates');
      }, 500);
    } catch (err: any) {
      console.error('Error deleting candidate:', err);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete candidate',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading candidate details..." />
      </div>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {error || 'Candidate not found'}
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The candidate you are looking for may have been removed or does not exist.
        </p>
        <div className="pt-2">
          <Link
            href="/candidates"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Candidates</span>
          </Link>
        </div>
      </div>
    );
  }

  // Candidate Initials for Avatar
  const initials = candidate.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={cn(
            'flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all animate-in fade-in slide-in-from-top-2',
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
          role="alert"
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-current transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to candidates</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isEditMode ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setTargetStage((candidate.stage as Stage) || 'Applied');
                  setStageNotes('');
                  setIsStageModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Change Stage</span>
              </button>

              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-xl transition-colors"
                title="Delete Candidate"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Candidate Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Profile Header Band */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                {initials || 'C'}
              </div>

              <div className="min-w-0 flex-1">
                {isEditMode ? (
                  <div className="space-y-3 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Candidate Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className={cn(
                          'w-full px-3 py-1.5 text-base font-semibold border rounded-lg',
                          editErrors.name ? 'border-red-400' : 'border-slate-300'
                        )}
                        placeholder="Candidate Name"
                      />
                      {editErrors.name && (
                        <p className="text-xs text-red-600 mt-0.5">{editErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Position / Role *
                      </label>
                      <input
                        type="text"
                        value={editFormData.position}
                        onChange={(e) =>
                          setEditFormData((prev) => ({ ...prev, position: e.target.value }))
                        }
                        className={cn(
                          'w-full px-3 py-1.5 text-sm border rounded-lg',
                          editErrors.position ? 'border-red-400' : 'border-slate-300'
                        )}
                        placeholder="Position"
                      />
                      {editErrors.position && (
                        <p className="text-xs text-red-600 mt-0.5">{editErrors.position}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      {candidate.name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium mt-1">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span>{candidate.position}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Stage Badge & Quick Stage Switch */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Current Stage
              </span>
              <div className="flex items-center gap-2">
                <StageBadge stage={candidate.stage} size="lg" />
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetStage((candidate.stage as Stage) || 'Applied');
                      setStageNotes('');
                      setIsStageModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                    title="Change Stage"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact and Metadata Information */}
        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Contact & Application Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Field */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Email Address</span>
              {isEditMode ? (
                <div>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-xl',
                      editErrors.email ? 'border-red-400' : 'border-slate-200'
                    )}
                  />
                  {editErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{editErrors.email}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href={`mailto:${candidate.email}`}
                    className="hover:text-blue-600 hover:underline truncate"
                  >
                    {candidate.email}
                  </a>
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Phone Number</span>
              {isEditMode ? (
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  {candidate.phone ? (
                    <a
                      href={`tel:${candidate.phone}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {candidate.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not provided</span>
                  )}
                </div>
              )}
            </div>

            {/* Resume Link */}
            <div className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-slate-500">
                Resume / Document Link
              </span>
              {isEditMode ? (
                <div>
                  <input
                    type="url"
                    value={editFormData.resumeLink}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        resumeLink: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-xl',
                      editErrors.resumeLink ? 'border-red-400' : 'border-slate-200'
                    )}
                  />
                  {editErrors.resumeLink && (
                    <p className="text-xs text-red-600 mt-1">
                      {editErrors.resumeLink}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                  {candidate.resumeLink ? (
                    <a
                      href={candidate.resumeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-medium break-all"
                    >
                      <span>{candidate.resumeLink}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No resume link provided</span>
                  )}
                </div>
              )}
            </div>

            {/* Applied & Updated Timestamps */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Applied on {formatDate(candidate.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Last updated: {formatDateTime(candidate.updatedAt)}</span>
            </div>
          </div>

          {/* Notes Section */}
          <div className="pt-6 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Notes & Evaluation</span>
              </div>
            </div>

            {isEditMode ? (
              <textarea
                rows={5}
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Candidate notes, interview impressions, compensation details, etc."
                className="w-full p-3.5 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none"
              />
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {candidate.notes ? (
                  candidate.notes
                ) : (
                  <span className="text-slate-400 italic">
                    No notes recorded yet for this candidate. Click Edit to add notes.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stage History Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Stage History & Activity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of stage changes and transition notes
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {candidate.stageHistory?.length || 0}{' '}
            {candidate.stageHistory?.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {candidate.stageHistory && candidate.stageHistory.length > 0 ? (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {candidate.stageHistory.map((item, index) => {
              const dotColor =
                STAGE_DOT_COLORS[item.toStage as Stage] || 'bg-slate-400';
              const isFirst = index === 0;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={cn(
                      'absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110',
                      isFirst ? 'border-blue-600' : 'border-slate-300'
                    )}
                  >
                    <span className={cn('w-2.5 h-2.5 rounded-full', dotColor)} />
                  </div>

                  {/* Timeline Event Card */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 hover:border-slate-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Transition badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.fromStage !== item.toStage ? (
                          <>
                            <StageBadge stage={item.fromStage} size="sm" />
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <StageBadge stage={item.toStage} size="sm" />
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">
                              Initial Stage:
                            </span>
                            <StageBadge stage={item.toStage} size="sm" />
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-slate-400">
                        {formatDateTime(item.changedAt)}
                      </span>
                    </div>

                    {/* Transition Notes */}
                    {item.notes && (
                      <p className="mt-2.5 text-xs sm:text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            <GitCommit className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>No stage transition history recorded yet.</p>
          </div>
        )}
      </div>

      {/* Stage Change Modal */}
      {isStageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isUpdatingStage && setIsStageModalOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Change Candidate Stage
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Move <span className="font-semibold text-slate-800">{candidate.name}</span> to a different pipeline stage
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                disabled={isUpdatingStage}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Selector Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Select Destination Stage
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {STAGES.map((s) => {
                  const isSelected = targetStage === s;
                  const isCurrent = candidate.stage === s;
                  const dotColor = STAGE_DOT_COLORS[s];

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTargetStage(s)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left',
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', dotColor)} />
                      <div className="min-w-0">
                        <div className="truncate">{s}</div>
                        {isCurrent && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Current
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Stage Transition Notes */}
            <div className="space-y-1.5">
              <label
                htmlFor="stage-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Transition Notes <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                id="stage-notes"
                rows={3}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="Reason for stage change, feedback from interviewer, assessment results..."
                disabled={isUpdatingStage}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                disabled={isUpdatingStage}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStage}
                disabled={isUpdatingStage}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-60"
              >
                {isUpdatingStage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Stage...</span>
                  </>
                ) : (
                  <span>Update Stage</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        candidateName={candidate.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
