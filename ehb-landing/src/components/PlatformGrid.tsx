'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { PLATFORMS, type Platform } from '@/lib/platforms';
import GlowCard from './ui/GlowCard';

const STATUS_CONFIG = {
  live: { label: 'Live', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  beta: { label: 'Beta', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  'coming-soon': { label: 'Soon', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
};

const FILTER_OPTIONS = ['All', 'Live', 'Beta', 'Coming Soon'];

function PlatformCard({ platform }: { platform: Platform }) {
  const status = STATUS_CONFIG[platform.status];
  return (
    <GlowCard glowColor={`${platform.color}10`} className="p-5 h-full shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl text-xl"
          style={{ background: `${platform.color}12`, border: `1px solid ${platform.color}25` }}
        >
          {platform.icon}
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${platform.status === 'live' ? 'animate-pulse' : ''}`} />
          {status.label}
        </span>
      </div>
      <h3 className="font-display text-sm font-bold text-slate-900 mb-0.5">{platform.name}</h3>
      <p className="text-xs font-semibold mb-3" style={{ color: platform.color }}>{platform.industry}</p>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">{platform.description}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span style={{ color: platform.color }}>⚡</span>
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
    <section id="platforms" className="relative section-padding bg-[#F7F9FF]">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-label mb-5"
          >
            EHB Ecosystem
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4"
          >
            Every platform,{' '}
            <span className="gradient-text-cyan">one trust layer.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-lg text-slate-500 text-base leading-relaxed mb-8"
          >
            From e-commerce to healthcare to legal services — every EHB platform runs on the same
            verified trust infrastructure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((platform, i) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35 + i * 0.05, duration: 0.5 }}
              layout
            >
              <PlatformCard platform={platform} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="mt-10 text-center"
        >
          <p className="text-slate-400 text-sm">
            Currently showing {PLATFORMS.length} platforms ·{' '}
            <span className="text-slate-600 font-medium">30+ platforms launching by 2026</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
