'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { INDUSTRIES } from '@/lib/platforms';

export default function Industries() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="relative section-padding" id="industries">
      {/* BG gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/[0.02] to-transparent pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-widest mb-5"
          >
            Industries We Cover
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4"
          >
            Trust across{' '}
            <span className="gradient-text-cyan">every sector.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-md text-white/45 text-lg leading-relaxed"
          >
            EHB's trust infrastructure is industry-agnostic.
            The same PSS engine, adapted to the criteria of every sector.
          </motion.p>
        </div>

        {/* Industry grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {INDUSTRIES.map((industry, i) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at center, ${industry.color}10, transparent 70%)` }}
              />

              {/* Icon */}
              <span className="text-3xl relative z-10">{industry.icon}</span>

              {/* Name */}
              <div className="text-center relative z-10">
                <p className="font-semibold text-sm text-white/80 group-hover:text-white transition-colors leading-tight">
                  {industry.name}
                </p>
                <p className="text-xs text-white/30 mt-0.5 leading-tight">{industry.description}</p>
              </div>

              {/* Color accent line at bottom */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-1/2 rounded-full transition-all duration-300"
                style={{ background: industry.color }}
              />
            </motion.div>
          ))}
        </div>

        {/* Expansion note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="mt-10 text-center text-white/25 text-sm"
        >
          Showing 12 industries ·{' '}
          <span className="text-white/40 font-medium">Expanding to 30+ by 2026</span>
        </motion.p>
      </div>
    </section>
  );
}
