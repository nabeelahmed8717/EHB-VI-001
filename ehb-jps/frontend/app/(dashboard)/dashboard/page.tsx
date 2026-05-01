'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Briefcase } from 'lucide-react';
import { useGetProfilesQuery } from '@/lib/store/api/profiles.api';
import { StatusBadge } from '@/components/profile/status-badge';
import { SqBadge } from '@/components/profile/sq-badge';
import { getRoleLabel, getRoleIcon, getPlatformLabel, formatDateShort } from '@/lib/utils';

const ROLES = [
  '', 'seller', 'buyer', 'rider', 'chef', 'driver',
  'cleaner', 'electrician', 'plumber', 'trainer',
  'worker', 'employer', 'freelancer', 'recruiter',
  'doctor', 'nurse', 'lawyer', 'teacher', 'other',
];
const STATUS_OPTIONS = ['', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'resubmit_required'];

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useGetProfilesQuery({
    page,
    limit,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const profiles = data?.profiles ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const filtered = search
    ? profiles.filter(
        (p) =>
          p.display_name.toLowerCase().includes(search.toLowerCase()) ||
          p.role.toLowerCase().includes(search.toLowerCase()),
      )
    : profiles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Profiles</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your professional profiles across EHB platforms.
          </p>
        </div>
        <Link
          href="/profiles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Profile
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search profiles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {ROLES.filter(Boolean).map((r) => (
            <option key={r} value={r}>{getRoleLabel(r)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-3 w-full" />
              <div className="flex gap-2">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Failed to load profiles. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 mx-auto mb-4">
            <Briefcase className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-800">No profiles yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create your first professional profile to get started.
          </p>
          <Link
            href="/profiles/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Profile
          </Link>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((profile) => (
              <Link
                key={profile._id}
                href={`/profiles/${profile._id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{getRoleIcon(profile.role)}</span>
                  <StatusBadge status={profile.status} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {profile.display_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getRoleLabel(profile.role)}
                    {profile.platform && (
                      <span className="text-gray-400"> · {getPlatformLabel(profile.platform)}</span>
                    )}
                  </p>
                </div>
                {profile.bio && (
                  <p className="text-sm text-gray-500 line-clamp-2">{profile.bio}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <SqBadge level={profile.sq_level} />
                  <span className="text-xs text-gray-400">{formatDateShort(profile.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
