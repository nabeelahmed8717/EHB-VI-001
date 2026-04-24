'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AnimatedCounter from './ui/AnimatedCounter';

const STATS = [
  {
    value: 30,
    suffix: '+',
    label: 'Service Platforms',
    description: 'Across every industry',
    color: 'text-cyan-400',
  },
  {
    value: 1,
    suffix: '',
    label: 'Unified Trust Engine',
    description: 'PSS governs them all',
    color: 'text-blue-400',
  },
  {
    value: 10,
    suffix: '',
    label: 'SQ Trust Levels',
    description: 'SQ1 through SQ10',
    color: 'text-purple-400',
  },
  {
    value: 100,
    suffix: '%',
    label: 'Audit Logged',
    description: 'Every decision tracked',
    color: 'text-emerald-400',
  },
];

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-12 border-y border-white/[0.06] overflow-hidden">
      {/* Subtle gradient line */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/[0.04] to-transparent pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/[0.06]">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center py-6 px-4 text-center"
            >
              <div className={`font-display text-4xl md:text-5xl font-black tracking-tight mb-1 ${stat.color}`}>
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  duration={1800}
                />
              </div>
              <div className="text-sm font-semibold text-white/80 mb-0.5">{stat.label}</div>
              <div className="text-xs text-white/35 font-medium">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
