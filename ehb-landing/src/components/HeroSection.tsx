'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Shield, Zap } from 'lucide-react';

const PLATFORM_BADGES = [
  { label: 'PSS Verified', icon: '⚡', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { label: 'SQ10 Certified', icon: '🏆', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { label: 'GoSellr', icon: '🛒', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { label: 'Healthcare', icon: '🏥', color: 'bg-red-50 border-red-200 text-red-700' },
  { label: 'Legal Pro', icon: '⚖️', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { label: '30+ Platforms', icon: '🌐', color: 'bg-blue-50 border-blue-200 text-blue-700' },
];

const STATS = [
  { value: '30+', label: 'Platforms' },
  { value: '99.9%', label: 'Uptime' },
  { value: '1M+', label: 'Verifications' },
  { value: 'SQ10', label: 'Max Trust Level' },
];

const MOCK_ROWS = [
  { name: 'GoSellr', category: 'E-Commerce', score: 'SQ 9', status: 'Verified', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { name: 'MedPlus', category: 'Healthcare', score: 'SQ 10', status: 'Certified', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { name: 'LegalPro', category: 'Legal', score: 'SQ 8', status: 'Verified', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { name: 'EduCore', category: 'Education', score: 'SQ 7', status: 'Pending', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

const CHART_BARS = [35, 55, 42, 70, 58, 85, 72, 90, 65, 88, 75, 95];

export default function HeroSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.4], [0, 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#F7F9FF] grid-bg"
    >
      {/* Light glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-blue-400/[0.06] blur-[140px]" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-400/[0.05] blur-[100px]" />
        <div className="absolute top-2/3 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-400/[0.04] blur-[100px]" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-28 pb-16 text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold mb-7 tracking-wide"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          </span>
          Now live — PSS Trust Engine v2.0
          <ArrowRight className="h-3 w-3 text-blue-400" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[2.5rem] sm:text-5xl md:text-[3.25rem] lg:text-[3.75rem] font-bold tracking-tight leading-[1.1] mb-5 text-slate-900"
        >
          The Trust Infrastructure{' '}
          <br className="hidden sm:block" />
          <span className="gradient-text-cyan">for Everything</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto max-w-xl text-base text-slate-500 leading-relaxed mb-9"
        >
          EHB governs{' '}
          <span className="text-slate-700 font-medium">30+ independent service platforms</span>{' '}
          across every industry through one unified verification engine — PSS.
          Every entity. Every platform. One trust score.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
        >
          <motion.a
            href="#platforms"
            className="group flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.preventDefault(); document.querySelector('#platforms')?.scrollIntoView({ behavior: 'smooth' }); }}
          >
            Explore Platforms
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.a>

          <motion.a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:bg-white transition-all shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.preventDefault(); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
          >
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            How It Works
          </motion.a>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-3xl"
        >
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-b from-blue-200/30 via-cyan-100/20 to-transparent blur-2xl pointer-events-none" />

          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 overflow-hidden">
            {/* Window bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-slate-400 text-xs font-mono ml-2">EHB Trust Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold border border-blue-100">
                  PSS Engine v2.0
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 + i * 0.07 }}
                  className="px-4 py-3 text-center"
                >
                  <div className="text-base font-bold text-slate-800">{s.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Table */}
            <div className="divide-y divide-slate-50">
              <div className="grid grid-cols-4 px-5 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/60">
                <span>Platform</span>
                <span>Category</span>
                <span>SQ Score</span>
                <span>Status</span>
              </div>
              {MOCK_ROWS.map((row, i) => (
                <motion.div
                  key={row.name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.95 + i * 0.08 }}
                  className="grid grid-cols-4 items-center px-5 py-2.5 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-200 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-blue-500" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{row.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{row.category}</span>
                  <span className="text-xs font-bold text-blue-600">{row.score}</span>
                  <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit ${row.color}`}>
                    {row.status}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40">
              <div className="flex items-end gap-1 h-8">
                {CHART_BARS.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 1.2 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
                    style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                    className={`flex-1 rounded-sm ${i === 11 ? 'bg-blue-500' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400">Platform trust activity — last 12 months</span>
                <span className="text-[10px] text-emerald-600 font-semibold">↑ 18.4%</span>
              </div>
            </div>
          </div>

          {/* Badge chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {PLATFORM_BADGES.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.07 }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${badge.color}`}
              >
                <span className="text-[10px]">{badge.icon}</span>
                <span>{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-px h-7 bg-gradient-to-b from-slate-300 to-transparent"
        />
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F7F9FF] to-transparent pointer-events-none" />
    </section>
  );
}
