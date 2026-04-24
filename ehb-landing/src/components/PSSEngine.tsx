'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Zap, ShieldCheck, GitBranch, BarChart3, Eye, Lock } from 'lucide-react';

const PSS_FEATURES = [
  {
    icon: ShieldCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    title: 'Identity Validation',
    description: 'Cross-platform identity verification with credential authenticity checks for every entity.',
  },
  {
    icon: BarChart3,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'SQ Score Calculation',
    description: 'Platform-specific criteria mapping that produces a precise SQ trust score per entity.',
  },
  {
    icon: GitBranch,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Admin Rule Engine',
    description: 'Configurable routing rules: auto-approve, Franchise review, or EDR escalation.',
  },
  {
    icon: Eye,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Fraud & Risk Detection',
    description: 'Real-time risk scoring and anomaly detection across all submission patterns.',
  },
  {
    icon: Lock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Franchise Governance',
    description: 'Auto-creates area franchises for regional oversight of new entity registrations.',
  },
  {
    icon: Zap,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    title: 'Full Audit Trail',
    description: 'Every SQ decision — approve, reject, or conditional — is permanently logged.',
  },
];

// Orbiting platform icons around PSS center
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
    <section id="pss" className="relative section-padding overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-600/[0.04] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-widest mb-5"
          >
            PSS — Platform Security System
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5"
          >
            The engine that{' '}
            <span className="gradient-text-cyan">powers trust.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-xl text-white/45 text-lg leading-relaxed"
          >
            PSS is the most critical system in EHB. It is deployed first. Every platform depends on it.
            Every verification goes through it. No exceptions.
          </motion.p>
        </div>

        {/* Visual Hub Diagram + Feature Cards */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Orbital diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center h-[380px] mx-auto w-full max-w-[380px]"
          >
            {/* Outer orbit ring */}
            <div className="absolute w-64 h-64 rounded-full border border-white/[0.06] border-dashed" />
            {/* Middle ring */}
            <div className="absolute w-44 h-44 rounded-full border border-white/[0.04]" />

            {/* Orbiting platforms */}
            {ORBIT_PLATFORMS.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const radius = 128;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;

              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 300 }}
                  className="absolute flex flex-col items-center gap-1 group"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + i * 0.4, ease: 'easeInOut', delay: i * 0.3 }}
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-lg shadow-lg"
                    style={{
                      background: `${p.color}18`,
                      border: `1px solid ${p.color}35`,
                      boxShadow: `0 0 16px ${p.color}20`,
                    }}
                  >
                    {p.icon}
                  </motion.div>
                  <span className="text-[9px] font-medium text-white/30 group-hover:text-white/60 transition-colors whitespace-nowrap">
                    {p.name}
                  </span>

                  {/* Connection line to center */}
                  <svg
                    className="absolute pointer-events-none"
                    style={{
                      width: Math.abs(x) + 20,
                      height: Math.abs(y) + 20,
                      left: x > 0 ? -Math.abs(x) / 2 - 10 : -(Math.abs(x) / 2) - 10,
                      top: y > 0 ? -Math.abs(y) / 2 - 10 : -(Math.abs(y) / 2) - 10,
                    }}
                  >
                    <motion.line
                      x1="50%" y1="50%"
                      x2={x > 0 ? '100%' : '0%'}
                      y2={y > 0 ? '100%' : '0%'}
                      stroke={p.color}
                      strokeWidth="0.5"
                      strokeOpacity="0.2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                    />
                  </svg>
                </motion.div>
              );
            })}

            {/* PSS Center Hub */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="relative z-10 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 animate-pulse-glow"
            >
              <Zap className="h-7 w-7 text-cyan-400 fill-cyan-400/30 mb-1" />
              <span className="font-display text-xs font-bold text-cyan-400 tracking-widest">PSS</span>
              {/* Pulse rings */}
              <span className="absolute inset-0 rounded-2xl animate-ping border border-cyan-400/20 scale-125" />
              <span className="absolute inset-0 rounded-2xl animate-ping border border-cyan-400/10 scale-150 animation-delay-500" style={{ animationDelay: '0.5s' }} />
            </motion.div>
          </motion.div>

          {/* Right: Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PSS_FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all group"
                >
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border ${feature.bg} mb-3`}>
                    <Icon className={`h-4.5 w-4.5 ${feature.color}`} />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1.5">{feature.title}</h4>
                  <p className="text-white/40 text-xs leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
