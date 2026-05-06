'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyStoredToken, clearEhbToken, getStoredEhbToken, ehbApi } from '@/lib/api';
import { colors } from '@/lib/theme';
import { Loader2 } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface User {
  ehb_user_id: string;
  email: string;
  full_name: string;
  registered_platforms: string[];
}

/* ─── Nav config ─────────────────────────────────────────────── */
const NAV_MID = [
  { label: 'Dashboard', icon: GridIcon,      active: true },
  { label: 'Platforms', icon: PlatformsIcon  },
  { label: 'Analytics', icon: AnalyticsIcon  },
  { label: 'Community', icon: UsersIcon      },
  { label: 'Calendar',  icon: CalendarIcon   },
];
const NAV_BOT = [
  { label: 'Security',  icon: SecurityIcon   },
  { label: 'Account',   icon: AccountIcon    },
  { label: 'Handbook',  icon: HandbookIcon   },
];

/* ─── Page ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'overview' | 'services'>('overview');

  useEffect(() => {
    verifyStoredToken().then((u) => {
      if (!u) router.replace('/login');
      else { setUser(u); setLoading(false); }
    });
  }, [router]);

  const handleLogout = async () => {
    const token = getStoredEhbToken();
    if (token) await ehbApi.logout(token);
    else clearEhbToken();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg.page }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: colors.accent.DEFAULT }} />
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] ?? 'User';
  const initials  = (user?.full_name ?? 'U')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.bg.page, color: colors.text.primary, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ══════════════ LEFT SIDEBAR — Stakent style ══════════════ */}
      <aside
        className="flex-shrink-0 flex flex-col"
        style={{ width: '230px', background: colors.bg.sidebar, borderRight: `1px solid ${colors.border.subtle}` }}
      >
        {/* ── Logo area ── */}
        <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C6EFF 0%, #B59BF5 100%)', color: '#fff' }}
          >
            E
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold leading-none" style={{ fontSize: 14, color: colors.text.primary }}>
              EHB Portal <sup style={{ fontSize: 8, color: colors.text.muted }}>®</sup>
            </p>
            <p style={{ fontSize: 10, color: colors.text.muted, marginTop: 3 }}>Unified Identity</p>
          </div>
          {/* Up-down sort icon like Stakent */}
          <svg style={{ width: 16, height: 16, color: colors.icon.inactive, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
          </svg>
        </div>

        {/* ── Toggle tabs ── */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex rounded-xl p-1" style={{ background: '#13141F' }}>
            {(['overview', 'services'] as const).map((tab) => {
              const isActive = sidebarTab === tab;
              const label = tab === 'overview' ? 'Overview' : 'Services';
              return (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className="flex-1 rounded-lg font-semibold transition-all"
                  style={{
                    fontSize: 12,
                    padding: '7px 0',
                    background: isActive ? colors.nav.activeBg : 'transparent',
                    color: isActive ? colors.text.primary : colors.text.muted,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Nav — scrollable ── */}
        <nav className="flex-1 overflow-y-auto px-3 pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#22243C transparent' }}>

          {sidebarTab === 'overview' ? (
            /* ── OVERVIEW TAB: main navigation ── */
            <>
              <div className="flex flex-col gap-0.5 mb-1">
                {NAV_MID.map(({ label, icon: Icon, active }) => (
                  <NavItem key={label} label={label} Icon={Icon} active={active} />
                ))}
              </div>

              <div className="my-2" style={{ height: 1, background: colors.border.subtle }} />

              <div className="flex flex-col gap-0.5 mb-1">
                {[
                  { label: 'Security',       icon: SecurityIcon,   badge: undefined },
                  { label: 'Account',        icon: AccountIcon,    badge: undefined },
                  { label: 'Handbook',       icon: HandbookIcon,   badge: 'Beta'    },
                  { label: 'Help & Support', icon: HeadphonesIcon, badge: undefined },
                ].map(({ label, icon: Icon, badge }) => (
                  <NavItem key={label} label={label} Icon={Icon} badge={badge} />
                ))}
              </div>
            </>
          ) : (
            /* ── SERVICES TAB: active EHB platforms ── */
            <SidebarServicesSection user={user} />
          )}
        </nav>

        {/* ── Bottom: Logout + Upgrade CTA ── */}
        <div className="px-3 pb-4 pt-2 space-y-2" style={{ borderTop: `1px solid ${colors.border.subtle}` }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left transition-colors"
            style={{ fontSize: 13, color: colors.nav.inactiveText }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = colors.semantic.danger;
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = colors.nav.inactiveText;
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <LogOutIcon className="h-4 w-4 flex-shrink-0" style={{ color: 'currentColor' }} />
            <span>Logout</span>
          </button>

          {/* Upgrade CTA */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1D1E2E 0%, #1A1240 100%)', border: '1px solid rgba(124,110,255,0.20)' }}
          >
            <div className="absolute -top-6 -right-6 rounded-full pointer-events-none"
              style={{ width: 90, height: 90, background: 'radial-gradient(circle, rgba(124,110,255,0.25) 0%, transparent 70%)' }} />
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{ fontSize: 15 }}>⚡</span>
              <p className="font-bold" style={{ fontSize: 12, color: '#F2F3F8' }}>Activate EHB Pro</p>
            </div>
            <p style={{ fontSize: 11, color: '#9EA3C0', lineHeight: 1.5, marginBottom: 10 }}>
              Unlock all features across EHB platforms
            </p>
            <button
              className="w-full rounded-xl font-semibold transition"
              style={{ fontSize: 11, padding: '8px 0', background: colors.accent.DEFAULT, color: colors.accent.text, border: 'none', cursor: 'pointer' }}
            >
              Upgrade Now 🔒
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════ MAIN COLUMN ══════════════ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── Top Header — Stakent style ── */}
        <header
          className="flex items-center gap-3 px-6 flex-shrink-0"
          style={{ height: 64, background: colors.bg.sidebar, borderBottom: `1px solid ${colors.border.subtle}` }}
        >
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span style={{ fontSize: 13, color: colors.text.muted }}>Pages</span>
            <span style={{ fontSize: 13, color: colors.text.muted }}>/</span>
            <span className="font-semibold" style={{ fontSize: 13, color: colors.text.primary }}>Dashboard</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right cluster — user profile + CTA + utilities (like Stakent header) */}
          <div className="flex items-center gap-2.5">

            {/* Search */}
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: colors.icon.inactive }}
              />
              <input
                type="text"
                placeholder="Search…"
                className="outline-none transition"
                style={{
                  fontSize: 12,
                  paddingLeft: 32,
                  paddingRight: 14,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: 10,
                  background: colors.bg.input,
                  border: `1px solid ${colors.border.subtle}`,
                  color: colors.text.secondary,
                  width: 170,
                }}
              />
            </div>

            {/* Bell */}
            <button
              className="relative flex items-center justify-center rounded-xl transition"
              style={{ width: 36, height: 36, background: colors.bg.input, border: `1px solid ${colors.border.subtle}`, color: colors.icon.inactive }}
            >
              <BellIcon className="h-4 w-4" />
              <span
                className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center font-bold"
                style={{ fontSize: 8, background: '#7C6EFF', color: '#fff' }}
              >
                2
              </span>
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: colors.border.subtle }} />

            {/* User info — prominent, like Stakent */}
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7C6EFF 0%, #B59BF5 100%)', color: '#fff' }}
              >
                {initials}
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold" style={{ fontSize: 12, color: colors.text.primary }}>{user?.full_name}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="rounded-full font-bold"
                    style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(124,110,255,0.2)', color: '#B59BF5' }}
                  >
                    ACTIVE
                  </span>
                </div>
              </div>
              <ChevronDownIcon className="h-3.5 w-3.5" style={{ color: colors.icon.inactive }} />
            </div>

            {/* Deposit-style CTA — light lavender, dark text, icon right */}
            <button
              className="flex items-center gap-1.5 font-semibold transition"
              style={{
                fontSize: 12,
                padding: '8px 18px',
                borderRadius: 10,
                background: colors.accent.DEFAULT,
                color: colors.accent.text,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              <span>Explore</span>
              <span style={{ fontSize: 14 }}>🔒</span>
            </button>
          </div>
        </header>

        {/* ── Content Row ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Center / Main ── */}
          <main className="flex-1 overflow-y-auto" style={{ padding: '24px 24px 24px 24px' }}>

            {/* Section label */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p style={{ fontSize: 12, color: colors.text.muted, marginBottom: 4 }}>
                  🌙 Recommended for 24 hours
                </p>
                <h1 className="font-bold" style={{ fontSize: 22, color: colors.text.primary }}>
                  Welcome back, {firstName}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {['Overview', 'Activity', 'Services'].map((tab, i) => (
                  <button
                    key={tab}
                    className="rounded-lg transition"
                    style={{
                      fontSize: 12,
                      fontWeight: i === 0 ? 600 : 400,
                      padding: '6px 14px',
                      background: i === 0 ? colors.bg.active : 'transparent',
                      border: `1px solid ${i === 0 ? colors.border.medium : colors.border.subtle}`,
                      color: i === 0 ? colors.text.primary : colors.text.muted,
                      cursor: 'pointer',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Welcome banner */}
            <div
              className="rounded-2xl p-6 overflow-hidden relative flex items-center justify-between mb-5"
              style={{
                background: colors.bg.card,
                border: `1px solid ${colors.border.subtle}`,
                minHeight: 130,
              }}
            >
              {/* Very subtle purple glow — top-left only */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: -30, left: -30,
                  width: 220, height: 220,
                  background: 'radial-gradient(circle, rgba(124,110,255,0.10) 0%, transparent 70%)',
                }}
              />

              <div className="relative">
                <p style={{ fontSize: 11, color: colors.text.muted, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Your EHB Identity
                </p>
                <h2 className="font-bold" style={{ fontSize: 20, color: colors.text.primary, marginBottom: 8 }}>
                  Hi <span style={{ color: '#C4B5FD' }}>{firstName}</span> 👋 — Your account is active
                </h2>
                <p style={{ fontSize: 12, color: colors.text.secondary, maxWidth: 340, lineHeight: 1.7 }}>
                  Your unified EHB identity is active. Explore the platform and manage your access across all services.
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <button
                    className="flex items-center gap-1.5 font-semibold transition"
                    style={{ fontSize: 12, padding: '8px 18px', borderRadius: 10, background: colors.accent.DEFAULT, color: colors.accent.text, border: 'none', cursor: 'pointer', letterSpacing: '0.02em' }}
                  >
                    Explore Modules 🔒
                  </button>
                  <button
                    className="transition"
                    style={{ fontSize: 12, padding: '8px 18px', borderRadius: 10, background: 'transparent', color: colors.text.secondary, border: `1px solid ${colors.border.medium}`, cursor: 'pointer' }}
                  >
                    View Profile
                  </button>
                </div>
              </div>

              {/* Hero illustration */}
              <img
                src="/dashboard-hero.png"
                alt="Dashboard hero"
                className="flex-shrink-0 object-contain select-none pointer-events-none relative"
                style={{ width: 150, height: 150, marginTop: -20, marginBottom: -20, opacity: 0.85 }}
              />
            </div>

            {/* ── Two-card row ── */}
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1.8fr' }}>

              {/* Learn card — Stakent "Liquid Staking Portfolio" style */}
              <div
                className="rounded-2xl flex flex-col relative overflow-hidden"
                style={{
                  background: '#1D1E2E',
                  border: '1px solid rgba(124,110,255,0.18)',
                  padding: '22px 20px 24px',
                }}
              >
                {/* Purple radial glow from bottom */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: -40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 340,
                    height: 220,
                    background: 'radial-gradient(ellipse at center, rgba(108,70,220,0.55) 0%, rgba(80,40,180,0.25) 45%, transparent 75%)',
                    borderRadius: '50%',
                  }}
                />

                {/* Top row: logo + New badge */}
                <div className="flex items-center justify-between mb-5 relative">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7C6EFF 0%, #B59BF5 100%)', color: '#fff' }}
                    >
                      E
                    </div>
                    <span className="font-bold" style={{ fontSize: 13, color: '#EEEEF8' }}>EHB</span>
                  </div>
                  <span
                    className="rounded-full font-semibold"
                    style={{ fontSize: 11, padding: '4px 12px', background: 'rgba(196,181,253,0.15)', color: '#C4B5FD', border: '1px solid rgba(196,181,253,0.25)' }}
                  >
                    New
                  </span>
                </div>

                {/* Heading */}
                <div className="relative flex-1">
                  <h2 className="font-bold leading-tight mb-3" style={{ fontSize: 22, color: '#F2F3F8' }}>
                    Learn about EHB Ecosystem
                  </h2>
                  <p style={{ fontSize: 12, color: '#9EA3C0', lineHeight: 1.7, marginBottom: 28 }}>
                    An all-in-one portal that helps you discover, access and manage all EHB platforms and services.
                  </p>
                </div>

                {/* Buttons */}
                <div className="relative flex flex-col gap-2.5">
                  {/* Primary — lavender fill */}
                  <button
                    className="w-full font-semibold flex items-center justify-center gap-2 transition"
                    style={{
                      padding: '12px 0',
                      borderRadius: 12,
                      fontSize: 13,
                      background: '#C4B5FD',
                      color: '#160D30',
                      border: 'none',
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Start Learning
                    <span style={{ fontSize: 16 }}>📚</span>
                  </button>

                  {/* Secondary — dark outline */}
                  <button
                    className="w-full font-semibold flex items-center justify-center gap-2 transition"
                    style={{
                      padding: '12px 0',
                      borderRadius: 12,
                      fontSize: 13,
                      background: 'rgba(255,255,255,0.05)',
                      color: '#C4B5FD',
                      border: '1px solid rgba(196,181,253,0.2)',
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Explore Platforms
                    <span style={{ fontSize: 14 }}>🔒</span>
                  </button>
                </div>
              </div>

              {/* Carousel */}
              <EhbCarousel />
            </div>
          </main>

          {/* ── Right Sidebar ── */}
          <aside
            className="flex-shrink-0 overflow-y-auto"
            style={{
              width: '272px',
              background: colors.bg.sidebar,
              borderLeft: `1px solid ${colors.border.subtle}`,
              padding: '20px 16px',
            }}
          >
            {/* User card */}
            <div
              className="rounded-2xl p-5 text-center mb-5"
              style={{
                background: 'linear-gradient(160deg, #1D1E2E 0%, #231540 100%)',
                border: `1px solid rgba(124,110,255,0.15)`,
              }}
            >
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center font-bold mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #7C6EFF 0%, #B59BF5 100%)', color: '#fff', fontSize: 20 }}
              >
                {initials}
              </div>
              <p className="font-bold" style={{ fontSize: 15, color: colors.text.primary }}>{user?.full_name}</p>
              <p className="mt-1 truncate" style={{ fontSize: 11, color: colors.text.muted }}>{user?.email}</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors.semantic.success }} />
                <span style={{ fontSize: 11, color: colors.text.secondary }}>Active</span>
              </div>
              <button
                className="mt-4 w-full rounded-xl font-semibold transition"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '8px 0',
                  background: colors.accent.DEFAULT,
                  border: 'none',
                  color: colors.accent.text,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                Manage Account
              </button>
            </div>

            {/* Active EHB Services */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold" style={{ fontSize: 11, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Active EHB Services
                </p>
              </div>
              {(() => {
                const ALL_PLATFORMS = [
                  { id: 'gosellr', name: 'GoSellr', desc: 'E-Commerce Platform',  dot: '#F59E0B' },
                  { id: 'ols',     name: 'OLS',     desc: 'Legal Marketplace',     dot: '#60A5FA' },
                  { id: 'hps',     name: 'HPS',     desc: 'Healthcare Services',   dot: '#4CAF50' },
                  { id: 'jps',     name: 'JPS',     desc: 'Workforce Management',  dot: '#A78BFA' },
                  { id: 'wms',     name: 'WMS',     desc: 'Hospital Management',   dot: '#F87171' },
                  { id: 'obs',     name: 'OBS',     desc: 'Book Retail',           dot: '#34D399' },
                ];
                const active = new Set(user?.registered_platforms ?? []);
                const activePlatforms   = ALL_PLATFORMS.filter(p =>  active.has(p.id));
                const inactivePlatforms = ALL_PLATFORMS.filter(p => !active.has(p.id));

                return (
                  <div className="space-y-1.5">
                    {activePlatforms.length === 0 && (
                      <p style={{ fontSize: 11, color: colors.text.muted }}>No active services yet.</p>
                    )}
                    {activePlatforms.map(({ id, name, desc, dot }) => (
                      <div
                        key={id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                        style={{ background: colors.bg.card, border: `1px solid ${colors.border.subtle}` }}
                      >
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold" style={{ fontSize: 12, color: colors.text.primary }}>{name}</p>
                          <p className="truncate" style={{ fontSize: 10, color: colors.text.muted }}>{desc}</p>
                        </div>
                        <span
                          className="rounded-full px-2 py-0.5 flex-shrink-0"
                          style={{ fontSize: 9, fontWeight: 600, background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}
                        >
                          Active
                        </span>
                      </div>
                    ))}
                    {inactivePlatforms.map(({ id, name, desc, dot }) => (
                      <div
                        key={id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                        style={{ background: colors.bg.card, border: `1px solid ${colors.border.subtle}`, opacity: 0.45 }}
                      >
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold" style={{ fontSize: 12, color: colors.text.primary }}>{name}</p>
                          <p className="truncate" style={{ fontSize: 10, color: colors.text.muted }}>{desc}</p>
                        </div>
                        <span
                          className="rounded-full px-2 py-0.5 flex-shrink-0"
                          style={{ fontSize: 9, fontWeight: 600, background: colors.bg.hover, color: colors.text.muted }}
                        >
                          Soon
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─── Circle Progress ────────────────────────────────────────── */
function CircleProgress({ pct, color }: { pct: number; color: string }) {
  const r = 13, circ = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0" style={{ width: 34, height: 34 }}>
      <svg width="34" height="34" viewBox="0 0 34 34" className="-rotate-90">
        <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="17" cy="17" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ fontSize: 8, color }}>{pct}%</span>
    </div>
  );
}

/* ─── Shared NavItem — Stakent style ─────────────────────────── */
function NavItem({
  label, Icon, active, badge,
}: {
  label: string;
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  active?: boolean;
  badge?: string;
}) {
  return (
    <button
      className="flex items-center gap-2.5 w-full text-left transition-all rounded-xl"
      style={{
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        padding: '9px 12px',
        background: active ? colors.nav.activeBg : 'transparent',
        color: active ? colors.text.primary : colors.nav.inactiveText,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <Icon
        className="h-4 w-4 flex-shrink-0"
        style={{ color: active ? '#C4B5FD' : colors.icon.inactive }}
      />
      <span className="flex-1">{label}</span>
      {badge === 'Beta' && (
        <span
          className="rounded-full font-semibold flex-shrink-0"
          style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(124,110,255,0.25)', color: '#B59BF5' }}
        >
          Beta
        </span>
      )}
    </button>
  );
}

/* ─── Active Services section (like Stakent's "Active Staking") ─ */
function SidebarServicesSection({ user }: { user: { registered_platforms: string[] } | null }) {
  const [expanded, setExpanded] = useState(true);

  const ALL_PLATFORMS = [
    { id: 'gosellr', name: 'GoSellr',  amount: 'E-Commerce',  color: '#F59E0B', bg: '#2A1F00' },
    { id: 'ols',     name: 'OLS',      amount: 'Legal Mkt',   color: '#60A5FA', bg: '#001A2A' },
    { id: 'hps',     name: 'HPS',      amount: 'Healthcare',  color: '#4CAF50', bg: '#002A0A' },
    { id: 'jps',     name: 'JPS',      amount: 'Workforce',   color: '#A78BFA', bg: '#1A0A2A' },
    { id: 'wms',     name: 'WMS',      amount: 'Hospital',    color: '#F87171', bg: '#2A0808' },
    { id: 'obs',     name: 'OBS',      amount: 'Book Retail', color: '#34D399', bg: '#002A18' },
  ];

  const active = new Set(user?.registered_platforms ?? []);
  const activePlatforms   = ALL_PLATFORMS.filter(p =>  active.has(p.id));
  const inactivePlatforms = ALL_PLATFORMS.filter(p => !active.has(p.id));
  const total = ALL_PLATFORMS.length;

  return (
    <div>
      {/* Section header */}
      <button
        className="flex items-center gap-2.5 w-full rounded-xl transition-all"
        style={{ fontSize: 13, fontWeight: 600, padding: '9px 12px', background: 'transparent', color: colors.text.primary, border: 'none', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <PlatformsIcon className="h-4 w-4 flex-shrink-0" style={{ color: colors.icon.inactive }} />
        <span className="flex-1 text-left">Active Services</span>
        {/* Count badge */}
        <span
          className="rounded-full font-bold flex-shrink-0 flex items-center justify-center"
          style={{ fontSize: 10, minWidth: 20, height: 20, padding: '0 6px', background: 'rgba(124,110,255,0.3)', color: '#C4B5FD' }}
        >
          {total}
        </span>
        {/* Chevron */}
        <svg
          style={{ width: 14, height: 14, color: colors.icon.inactive, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Sub-items */}
      {expanded && (
        <div className="mt-1 flex flex-col gap-0.5 pl-2">
          {activePlatforms.map(({ id, name, amount, color, bg }) => (
            <button
              key={id}
              className="flex items-center gap-2.5 w-full rounded-xl transition-all"
              style={{ padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {/* Colored platform icon */}
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                style={{ background: bg, border: `1px solid ${color}33`, fontSize: 11, color }}
              >
                {name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold truncate" style={{ fontSize: 11, color: '#A594FF', lineHeight: 1.3 }}>
                  {name}
                </p>
                <p style={{ fontSize: 10, color: colors.text.secondary, lineHeight: 1.3 }}>{amount}</p>
              </div>
            </button>
          ))}
          {inactivePlatforms.map(({ id, name, amount, color, bg }) => (
            <button
              key={id}
              className="flex items-center gap-2.5 w-full rounded-xl transition-all"
              style={{ padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.4 }}
            >
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                style={{ background: bg, border: `1px solid ${color}33`, fontSize: 11, color }}
              >
                {name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold truncate" style={{ fontSize: 11, color: colors.text.muted, lineHeight: 1.3 }}>
                  {name}
                </p>
                <p style={{ fontSize: 10, color: colors.text.muted, lineHeight: 1.3 }}>{amount}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── EHB Companies Carousel ────────────────────────────────── */
function EhbCarousel() {
  const [active, setActive] = useState(0);

  const slides = [
    { id: 'co-1', img: '/co-1.png', title: 'GoSellr',  desc: 'A powerful e-commerce platform to buy, sell and grow your business across Pakistan.' },
    { id: 'co-2', img: '/co-2.png', title: 'OLS',       desc: 'Online Legal Services connecting clients with verified lawyers and legal experts.' },
    { id: 'co-3', img: '/co-3.png', title: 'HPS',       desc: 'Healthcare Platform Services providing access to doctors, clinics and hospitals.' },
  ];

  const prev = () => setActive((a) => (a - 1 + slides.length) % slides.length);
  const next = () => setActive((a) => (a + 1) % slides.length);

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{ background: colors.bg.card, border: `1px solid ${colors.border.subtle}` }}
    >
      {/* Featured header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
      >
        <div className="flex items-center gap-2">
          <svg style={{ width: 15, height: 15, color: '#F59E0B' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.primary }}>Featured</span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 font-semibold"
          style={{ fontSize: 10, background: colors.accent.muted, color: '#B59BF5' }}
        >
          {slides.length} Platforms
        </span>
      </div>

      {/* Slide row */}
      <div className="flex items-center" style={{ padding: '20px 18px', minHeight: 200 }}>
        {/* Left arrow */}
        <button
          onClick={prev}
          className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition"
          style={{ background: colors.bg.hover, border: `1px solid ${colors.border.medium}` }}
        >
          <svg style={{ width: 14, height: 14, color: colors.text.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Image */}
        <div
          className="flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center mx-4"
          style={{ width: 160, height: 150, background: colors.bg.hover, border: `1px solid ${colors.border.subtle}` }}
        >
          <img
            key={slides[active].id}
            src={slides[active].img}
            alt={slides[active].title}
            className="w-full h-full object-contain select-none pointer-events-none"
            style={{ padding: 10 }}
          />
        </div>

        {/* Text + button */}
        <div className="flex-1 flex flex-col justify-between min-w-0 px-2" style={{ minHeight: 150 }}>
          <div>
            <p className="font-bold" style={{ fontSize: 19, color: colors.text.primary }}>{slides[active].title}</p>
            <p className="mt-2 leading-relaxed" style={{ fontSize: 12, color: colors.text.secondary }}>
              {slides[active].desc}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="rounded-full transition-all"
                  style={{
                    width:  i === active ? 18 : 6,
                    height: 6,
                    background: i === active ? colors.accent.DEFAULT : colors.border.medium,
                  }}
                />
              ))}
            </div>

            <button
              className="flex items-center gap-1.5 rounded-xl font-semibold transition"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '7px 18px',
                background: colors.accent.DEFAULT,
                border: 'none',
                color: colors.accent.text,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Explore 🔒
            </button>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition ml-3"
          style={{ background: colors.bg.hover, border: `1px solid ${colors.border.medium}` }}
        >
          <svg style={{ width: 14, height: 14, color: colors.text.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────── */
function PlatformsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
}
function AnalyticsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function SecurityIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function AccountIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function HandbookIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
}
function GridIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
}
function CalendarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function UsersIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function SearchIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function BellIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function HeadphonesIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>;
}
function LogOutIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
}
function ChevronDownIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
}
