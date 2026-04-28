'use client';

import { useAppSelector } from '@/lib/store/hooks';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your account information on JPS.</p>
      </div>

      {/* Account card */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700">Account</h3>
        </div>

        <div className="px-6 py-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              {user?.full_name
                ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.full_name ?? '—'}</p>
              <p className="text-sm text-gray-500">{user?.email ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <dl className="space-y-3">
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">JPS User ID</dt>
              <dd className="text-sm text-gray-800 font-mono">{user?.id ?? '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">EHB User ID</dt>
              <dd className="text-sm text-gray-800 font-mono">{user?.ehb_user_id ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* About JPS card */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700">About JPS</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            JPS (Job Providing Service) is an EHB platform that connects workers, employers,
            freelancers, trainers, and recruiters. All profiles go through PSS (Platform Support
            Service) SQ verification to ensure quality and trust across the EHB ecosystem.
          </p>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>Backend: port 3006</span>
            <span>·</span>
            <span>Frontend: port 4006</span>
          </div>
        </div>
      </div>
    </div>
  );
}
