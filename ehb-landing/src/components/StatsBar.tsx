'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AnimatedCounter from './ui/AnimatedCounter';

const STATS = [
  { value: 30, suffix: '+', label: 'Service Platforms', description: 'Across every industry', color: 'text-cyan-600' },
  { value: 1, suffix: '', label: 'Unified Trust Engine', description: 'PSS governs them all', color: 'text-blue-600' },
  { value: 10, suffix: '', label: 'SQ Trust Levels', description: 'SQ1 through SQ10', color: 'text-purple-600' },
  { value: 100, suffix: '%', label: 'Audit Logged', description: 'Every decision tracked', color: 'text-emerald-600' },
];

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative border-y border-slate-200 bg-white overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center justify-center py-8 px-4 text-center"
            >
              <div className={`font-display text-3xl md:text-4xl font-black tracking-tight mb-1 ${stat.color}`}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={1800} />
              </div>
              <div className="text-sm font-semibold text-slate-700 mb-0.5">{stat.label}</div>
              <div className="text-xs text-slate-400">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
