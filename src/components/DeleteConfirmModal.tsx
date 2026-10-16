'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen?: boolean;
  candidateName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  title?: string;
  description?: string;
}

export function DeleteConfirmModal({
  isOpen = true,
  candidateName,
  onConfirm,
  onCancel,
  isDeleting = false,
  title = 'Delete Candidate',
  description,
}: DeleteConfirmModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isDeleting) onCancel();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 transform transition-all duration-200 z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              id="modal-title"
              className="text-lg font-semibold text-slate-900 tracking-tight"
            >
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {description || (
                <>
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900">{candidateName}</span>?
                  This action cannot be undone and will permanently remove all associated
                  notes and pipeline data.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isDeleting ? 'Deleting...' : 'Delete Candidate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
