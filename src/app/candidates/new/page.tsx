'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Link as LinkIcon,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { STAGES, Stage, cn } from '@/lib/utils';

interface FormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: Stage;
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

export default function NewCandidatePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    stage: 'Applied',
    resumeLink: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position / Job role is required';
    }

    if (formData.resumeLink.trim()) {
      try {
        const url = new URL(formData.resumeLink.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.resumeLink = 'URL must start with http:// or https://';
        }
      } catch {
        newErrors.resumeLink = 'Please enter a valid website or document URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        position: formData.position.trim(),
        stage: formData.stage,
        resumeLink: formData.resumeLink.trim() || null,
        notes: formData.notes.trim() || null,
      };

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create candidate. Please try again.');
      }

      setToast({
        type: 'success',
        message: 'Candidate created successfully! Redirecting...',
      });

      // Redirect after brief delay for smooth user feedback
      setTimeout(() => {
        router.push('/candidates');
      }, 700);
    } catch (err) {
      console.error('Error creating candidate:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setToast({
        type: 'error',
        message: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      {/* Header and Back Link */}
      <div>
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to candidates</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Add New Candidate
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter candidate details to add them to your recruitment pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Candidate Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Sarah Jenkins"
                disabled={isSubmitting}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150',
                  'focus:outline-none focus:ring-3',
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15'
                )}
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sarah.jenkins@example.com"
                disabled={isSubmitting}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150',
                  'focus:outline-none focus:ring-3',
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15'
                )}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Phone Number <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 234-5678"
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none transition-all duration-150"
              />
            </div>
          </div>

          {/* Position - Text Input so users can add any position */}
          <div>
            <label
              htmlFor="position"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Position / Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Engineer"
                disabled={isSubmitting}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150',
                  'focus:outline-none focus:ring-3',
                  errors.position
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15'
                )}
              />
            </div>
            {errors.position ? (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.position}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                Enter any position title (e.g. Full Stack Developer, Product Designer)
              </p>
            )}
          </div>

          {/* Initial Stage */}
          <div>
            <label
              htmlFor="stage"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Initial Pipeline Stage
            </label>
            <select
              id="stage"
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none transition-all duration-150 cursor-pointer"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">
              Default stage is Applied. Can be changed at any time.
            </p>
          </div>

          {/* Resume Link */}
          <div className="sm:col-span-2">
            <label
              htmlFor="resumeLink"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Resume / Portfolio URL{' '}
              <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                id="resumeLink"
                name="resumeLink"
                value={formData.resumeLink}
                onChange={handleChange}
                placeholder="https://drive.google.com/file/... or https://linkedin.com/in/..."
                disabled={isSubmitting}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150',
                  'focus:outline-none focus:ring-3',
                  errors.resumeLink
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15'
                )}
              />
            </div>
            {errors.resumeLink && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.resumeLink}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Candidate Notes / Profile Summary{' '}
              <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add initial interview impressions, referral details, salary expectations, or portfolio highlights..."
                disabled={isSubmitting}
                className="w-full p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none transition-all duration-150"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Notes are visible on the candidate detail page and can be edited later.
            </p>
          </div>
        </div>

        {/* Form Footer Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Adding Candidate...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Add Candidate</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
