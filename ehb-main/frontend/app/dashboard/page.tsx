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
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: colors.text.secondary }} />
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] ?? 'User';
  const initials  = (user?.full_name ?? 'U')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden font-sans"
      style={{ background: colors.bg.page, color: colors.text.primary }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className="flex-shrink-0 flex flex-col py-4 px-2"
        style={{ width: '13rem', background: colors.bg.sidebar, borderRight: `1px solid ${colors.border.subtle}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-7">
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: colors.bg.hover, color: colors.text.primary }}
          >E</div>
          <span className="font-semibold tracking-wide" style={{ fontSize: 14, color: colors.text.primary }}>
            EHB Portal
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_MID.map(({ label, icon: Icon, active }) => (
            <NavItem key={label} label={label} Icon={Icon} active={active} />
          ))}

          <div className="my-3" style={{ height: 1, background: colors.border.subtle }} />

          {NAV_BOT.map(({ label, icon: Icon, chevron }) => (
            <NavItem key={label} label={label} Icon={Icon} chevron={chevron} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col gap-0.5 pt-3"
          style={{ borderTop: `1px solid ${colors.border.subtle}` }}>
          <NavItem label="Help & Support" Icon={HeadphonesIcon} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-left transition-colors"
            style={{ fontSize: 14, color: colors.nav.inactiveText }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = colors.semantic.danger;
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = colors.nav.inactiveText;
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <LogOutIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.icon.inactive }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header
          className="h-12 flex items-center gap-3 px-5 flex-shrink-0"
          style={{ background: colors.bg.sidebar, borderBottom: `1px solid ${colors.border.subtle}` }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5">
            <GridIcon className="h-3.5 w-3.5" style={{ color: colors.icon.inactive }} />
            <span className="font-medium" style={{ fontSize: 13, color: colors.text.primary }}>Dashboard</span>
            <span style={{ color: colors.text.muted, fontSize: 13 }}>···</span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <SearchIcon
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3"
              style={{ color: colors.icon.muted }}
            />
            <input
              type="text"
              placeholder="Search"
              className="outline-none transition"
              style={{
                fontSize: 12,
                paddingLeft: 28,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                borderRadius: 8,
                background: colors.bg.input,
                border: `1px solid ${colors.border.subtle}`,
                color: colors.text.secondary,
                width: 160,
              }}
            />
          </div>

          {/* Bell */}
          <button className="relative p-1.5 rounded-lg transition"
            style={{ color: colors.icon.inactive }}>
            <BellIcon className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
              style={{ background: colors.text.secondary }} />
          </button>

          {/* Avatar */}
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer select-none"
            style={{ background: colors.bg.active, color: colors.text.primary }}
          >{initials}</div>
        </header>

        {/* Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Center ── */}
          <main className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Welcome banner */}
            <div
              className="relative rounded-xl p-6 overflow-hidden flex items-center justify-between"
              style={{ background: colors.bg.card, border: `1px solid ${colors.border.subtle}`, minHeight: 130 }}
            >
              <div>
                <p className="mb-1" style={{ fontSize: 12, color: colors.text.muted }}>Welcome back</p>
                <h1 className="font-bold text-white mb-2" style={{ fontSize: 22 }}>
                  Hi, <span style={{ color: colors.text.primary }}>{firstName}</span>
                </h1>
                <p style={{ fontSize: 12, color: colors.text.secondary, maxWidth: 280, lineHeight: 1.6 }}>
                  Your unified EHB identity is active. Explore the platform and manage your access across all services.
                </p>
                <button
                  className="mt-4 transition"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '7px 16px',
                    borderRadius: 8,
                    background: colors.bg.active,
                    border: `1px solid ${colors.border.medium}`,
                    color: colors.text.primary,
                    cursor: 'pointer',
                  }}
                >
                  Explore Modules
                </button>
              </div>

              {/* Hero illustration */}
              <img
                src="/dashboard-hero.png"
                alt="Dashboard hero"
                className="flex-shrink-0 object-contain select-none pointer-events-none"
                style={{ width: 160, height: 160, marginTop: -20, marginBottom: -20,  }}
              />
            </div>

            {/* ── Two cards row ── */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1.8fr' }}>

              {/* Yellowish card — Learn about EHB Ecosystem */}
              <div
                className="rounded-xl p-5 flex flex-col items-center text-center gap-3"
                style={{ background: '#DFCB90', border: '1px solid rgba(0,0,0,0.08)' }}
              >
                {/* Books image */}
                <img
                  src="/books.png"
                  alt="Learn EHB"
                  className="object-contain select-none pointer-events-none"
                  style={{ width: 72, height: 72 }}
                />

                <div>
                  <p className="font-bold" style={{ fontSize: 14, color: '#1A1200' }}>Learn about EHB Ecosystem</p>
                  <p className="mt-1.5 leading-relaxed" style={{ fontSize: 11, color: '#5C4A10', maxWidth: 180 }}>
                    Discover all EHB platforms, services, and how they connect to empower you.
                  </p>
                </div>

                <button
                  className="w-full py-2.5 rounded-lg font-semibold transition mt-auto"
                  style={{ fontSize: 12, background: '#C8A830', color: '#1A1200', cursor: 'pointer' }}
                >
                  Start 
                </button>
              </div>

              {/* Right card — EHB Companies Carousel */}
              <EhbCarousel />
            </div>
          </main>

          {/* ── Right Sidebar ── */}
          <aside
            className="flex-shrink-0 overflow-y-auto p-4 space-y-5"
            style={{ width: '17rem', background: colors.bg.sidebar, borderLeft: `1px solid ${colors.border.subtle}` }}
          >
            {/* User card */}
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: colors.bg.card, border: `1px solid ${colors.border.subtle}` }}
            >
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center font-bold mx-auto mb-4"
                style={{ background: colors.bg.active, color: colors.text.primary, fontSize: 22 }}
              >{initials}</div>
              <p className="font-bold text-white" style={{ fontSize: 15 }}>{user?.full_name}</p>
              <p className="mt-1 truncate" style={{ fontSize: 12, color: colors.text.muted }}>{user?.email}</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: colors.semantic.success }} />
                <span style={{ fontSize: 12, color: colors.text.secondary }}>Active</span>
              </div>
              <button
                className="mt-4 w-full rounded-lg transition"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '8px 0',
                  background: colors.bg.hover,
                  border: `1px solid ${colors.border.medium}`,
                  color: colors.text.primary,
                  cursor: 'pointer',
                }}
              >
                Manage Account
              </button>
            </div>

            {/* Active EHB Services */}
            <div>
              <p className="font-semibold mb-3" style={{ fontSize: 12, color: colors.text.primary }}>
                Active EHB Services
              </p>
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
                const activePlatforms   = ALL_PLATFORMS.filter(p => active.has(p.id));
                const inactivePlatforms = ALL_PLATFORMS.filter(p => !active.has(p.id));

                return (
                  <div className="space-y-2">
                    {activePlatforms.length === 0 && (
                      <p style={{ fontSize: 11, color: colors.text.muted }}>
                        No active services yet.
                      </p>
                    )}
                    {activePlatforms.map(({ id, name, desc, dot }) => (
                      <div
                        key={id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
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
                        >Active</span>
                      </div>
                    ))}
                    {inactivePlatforms.map(({ id, name, desc, dot }) => (
                      <div
                        key={id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
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
                        >Soon</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div style={{ height: 1, background: colors.border.subtle }} />

            {/* Ongoing Assignments */}
            <div>
              <p className="font-semibold mb-3" style={{ fontSize: 12, color: colors.text.primary }}>
                Your Ongoing Assignments
              </p>
              <div className="space-y-3">
                {[
                  { title: 'Assignment 01', sub: 'Module Name', pct: 75 },
                  { title: 'Assignment 02', sub: 'Module Name', pct: 57 },
                  { title: 'Assignment 03', sub: 'Module Name', pct: 29 },
                  { title: 'Assignment 04', sub: 'Module Name', pct: 5  },
                  { title: 'Assignment 05', sub: 'Module Name', pct: 91 },
                ].map(({ title, sub, pct }, i) => (
                  <div key={title} className="flex items-center gap-2.5">
                    <CircleProgress pct={pct} color={colors.progress[i % colors.progress.length]} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ fontSize: 11, color: colors.text.primary }}>{title}</p>
                      <p className="mt-0.5 flex items-center gap-1" style={{ fontSize: 10, color: colors.text.muted }}>
                        <CalendarIcon className="h-2.5 w-2.5" />{sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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

/* ─── Shared NavItem ─────────────────────────────────────────── */
function NavItem({
  label, Icon, active, chevron,
}: {
  label: string;
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  active?: boolean;
  chevron?: boolean;
}) {
  return (
    <button
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-left transition-colors"
      style={
        active
          ? { fontSize: 14, fontWeight: 700, background: colors.nav.activeBg, color: colors.nav.activeText, borderRadius: 8 }
          : { fontSize: 14, color: colors.nav.inactiveText }
      }
    >
      <Icon
        className="h-3.5 w-3.5 flex-shrink-0"
        style={{ color: active ? colors.icon.active : colors.icon.inactive }}
      />
      <span className="flex-1">{label}</span>
      {chevron && <ChevronRightIcon className="h-3 w-3" style={{ color: colors.icon.muted }} />}
    </button>
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
      className="rounded-xl flex flex-col"
      style={{ background: colors.bg.card, border: `1px solid ${colors.border.subtle}` }}
    >
      {/* Featured header */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
      >
        <svg style={{ width: 15, height: 15, color: '#F59E0B' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.primary }}>Featured</span>
      </div>

      {/* Slide row */}
      <div className="flex items-center" style={{ padding: '20px 18px', minHeight: 200 }}>
      {/* Left arrow */}
      <button
        onClick={prev}
        className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition"
        style={{ background: colors.bg.hover, border: `1px solid ${colors.border.medium}` }}
      >
        <svg style={{ width: 16, height: 16, color: colors.text.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Image */}
      <div
        className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center mx-4"
        style={{ width: 170, height: 160, background: colors.bg.hover, border: `1px solid ${colors.border.subtle}` }}
      >
        <img
          key={slides[active].id}
          src={slides[active].img}
          alt={slides[active].title}
          className="w-full h-full object-contain select-none pointer-events-none"
          style={{ padding: 8 }}
        />
      </div>

      {/* Text + button */}
      <div className="flex-1 flex flex-col justify-between min-w-0 px-2" style={{ minHeight: 160 }}>
        <div>
          <p className="font-bold" style={{ fontSize: 20, color: colors.text.primary }}>{slides[active].title}</p>
          <p className="mt-2 leading-relaxed" style={{ fontSize: 13, color: colors.text.secondary }}>
            {slides[active].desc}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="rounded-full transition-all"
                style={{
                  width:  i === active ? 20 : 7,
                  height: 7,
                  background: i === active ? colors.text.secondary : colors.border.medium,
                }}
              />
            ))}
          </div>

          <button
            className="rounded-lg transition"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 22px',
              background: colors.bg.hover,
              border: `1px solid ${colors.border.medium}`,
              color: colors.text.primary,
              cursor: 'pointer',
            }}
          >
            Explore
          </button>
        </div>
      </div>

      {/* Right arrow */}
      <button
        onClick={next}
        className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition ml-3"
        style={{ background: colors.bg.hover, border: `1px solid ${colors.border.medium}` }}
      >
        <svg style={{ width: 16, height: 16, color: colors.text.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
function BookOpenIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
}
function ChevronRightIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
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
