'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { PLATFORMS, type Platform } from '@/lib/platforms';
import GlowCard from './ui/GlowCard';

const STATUS_CONFIG = {
  live: { label: 'Live', dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  beta: { label: 'Beta', dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  'coming-soon': { label: 'Soon', dot: 'bg-white/30', text: 'text-white/40', bg: 'bg-white/[0.05] border-white/10' },
};

const FILTER_OPTIONS = ['All', 'Live', 'Beta', 'Coming Soon'];

function PlatformCard({ platform, index }: { platform: Platform; index: number }) {
  const status = STATUS_CONFIG[platform.status];

  return (
    <GlowCard
      glowColor={`${platform.color}20`}
      className="p-5 h-full"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl text-2xl"
          style={{ background: `${platform.color}15`, border: `1px solid ${platform.color}25` }}
        >
          {platform.icon}
        </div>

        {/* Status badge */}
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${status.bg} ${status.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${platform.status === 'live' ? 'animate-pulse' : ''}`} />
          {status.label}
        </span>
      </div>

      {/* Platform name */}
      <h3 className="font-display text-base font-bold text-white mb-0.5">{platform.name}</h3>
      <p className="text-xs font-medium mb-3" style={{ color: platform.color }}>{platform.industry}</p>

      {/* Description */}
      <p className="text-sm text-white/45 leading-relaxed mb-4">{platform.description}</p>

      {/* PSS badge */}
      <div className="flex items-center gap-1.5 text-xs text-white/30">
        <span className="text-cyan-500">⚡</span>
        <span>PSS Verified · SQ1–SQ{platform.sqMax}</span>
      </div>
    </GlowCard>
  );
}

export default function PlatformGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = PLATFORMS.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Live') return p.status === 'live';
    if (activeFilter === 'Beta') return p.status === 'beta';
    if (activeFilter === 'Coming Soon') return p.status === 'coming-soon';
    return true;
  });

  return (
    <section id="platforms" className="relative section-padding">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/[0.03] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-widest mb-5"
          >
            EHB Ecosystem
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4"
          >
            Every platform,{' '}
            <span className="gradient-text-cyan">one trust layer.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-lg text-white/45 text-lg leading-relaxed mb-8"
          >
            From e-commerce to healthcare to legal services — every EHB platform runs on the same
            verified trust infrastructure.
          </motion.p>

          {/* Filter buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center gap-1 p-1 rounded-xl border border-white/[0.07] bg-white/[0.03]"
          >
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {filter}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Platform grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((platform, i) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              layout
            >
              <PlatformCard platform={platform} index={i} />
            </motion.div>
          ))}
        </div>

        {/* Bottom "30+ total" note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-10 text-center"
        >
          <p className="text-white/25 text-sm">
            Currently showing {PLATFORMS.length} platforms ·{' '}
            <span className="text-white/40 font-medium">30+ platforms launching by 2026</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
