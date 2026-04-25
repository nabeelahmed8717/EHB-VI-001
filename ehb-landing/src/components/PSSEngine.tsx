'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Zap, ShieldCheck, GitBranch, BarChart3, Eye, Lock } from 'lucide-react';

const PSS_FEATURES = [
  {
    icon: ShieldCheck,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200',
    title: 'Identity Validation',
    description: 'Cross-platform identity verification with credential authenticity checks for every entity.',
  },
  {
    icon: BarChart3,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    title: 'SQ Score Calculation',
    description: 'Platform-specific criteria mapping that produces a precise SQ trust score per entity.',
  },
  {
    icon: GitBranch,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    title: 'Admin Rule Engine',
    description: 'Configurable routing rules: auto-approve, Franchise review, or EDR escalation.',
  },
  {
    icon: Eye,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    title: 'Fraud & Risk Detection',
    description: 'Real-time risk scoring and anomaly detection across all submission patterns.',
  },
  {
    icon: Lock,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    title: 'Franchise Governance',
    description: 'Auto-creates area franchises for regional oversight of new entity registrations.',
  },
  {
    icon: Zap,
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    title: 'Full Audit Trail',
    description: 'Every SQ decision — approve, reject, or conditional — is permanently logged.',
  },
];

const ORBIT_PLATFORMS = [
  { icon: '🛒', name: 'GoSellr', angle: 0, color: '#10B981' },
  { icon: '⚖️', name: 'OLS', angle: 60, color: '#F59E0B' },
  { icon: '🏥', name: 'HPS', angle: 120, color: '#EF4444' },
  { icon: '💼', name: 'JPS', angle: 180, color: '#3B82F6' },
  { icon: '🏨', name: 'WMS', angle: 240, color: '#8B5CF6' },
  { icon: '📚', name: 'OBS', angle: 300, color: '#EC4899' },
];

export default function PSSEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="pss" className="relative section-padding bg-white overflow-hidden">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-label mb-5"
          >
            PSS — Platform Security System
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4"
          >
            The engine that{' '}
            <span className="gradient-text-cyan">powers trust.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-xl text-slate-500 text-base leading-relaxed"
          >
            PSS is the most critical system in EHB. It is deployed first. Every platform depends on it.
            Every verification goes through it. No exceptions.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Orbital diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative flex items-center justify-center h-[360px] mx-auto w-full max-w-[360px]"
          >
            <div className="absolute w-60 h-60 rounded-full border border-slate-200 border-dashed" />
            <div className="absolute w-40 h-40 rounded-full border border-slate-100" />

            {ORBIT_PLATFORMS.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const radius = 120;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 280 }}
                  className="absolute flex flex-col items-center gap-1 group"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + i * 0.4, ease: 'easeInOut', delay: i * 0.3 }}
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-lg shadow-md"
                    style={{
                      background: `${p.color}12`,
                      border: `1px solid ${p.color}30`,
                    }}
                  >
                    {p.icon}
                  </motion.div>
                  <span className="text-[9px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors whitespace-nowrap">
                    {p.name}
                  </span>
                </motion.div>
              );
            })}

            {/* PSS Center Hub */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="relative z-10 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-cyan-50 to-blue-100 shadow-lg shadow-blue-200/50"
            >
              <Zap className="h-6 w-6 text-blue-600 fill-blue-200 mb-1" />
              <span className="font-display text-xs font-black text-blue-700 tracking-widest">PSS</span>
              <span className="absolute inset-0 rounded-2xl animate-ping border-2 border-blue-300/40 scale-110" />
            </motion.div>
          </motion.div>

          {/* Right: Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PSS_FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border ${feature.bg} mb-3`}>
                    <Icon className={`h-4 w-4 ${feature.color}`} />
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-1.5">{feature.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
