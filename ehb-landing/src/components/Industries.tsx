'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { INDUSTRIES } from '@/lib/platforms';

export default function Industries() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="relative section-padding bg-[#F7F9FF]" id="industries">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-label mb-5"
          >
            Industries We Cover
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4"
          >
            Trust across{' '}
            <span className="gradient-text-cyan">every sector.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-md text-slate-500 text-base leading-relaxed"
          >
            EHB's trust infrastructure is industry-agnostic.
            The same PSS engine, adapted to the criteria of every sector.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {INDUSTRIES.map((industry, i) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
              className="group relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-default"
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at center, ${industry.color}08, transparent 70%)` }}
              />
              <span className="text-2xl relative z-10">{industry.icon}</span>
              <div className="text-center relative z-10">
                <p className="font-semibold text-sm text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">
                  {industry.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{industry.description}</p>
              </div>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-1/2 rounded-full transition-all duration-300"
                style={{ background: industry.color }}
              />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center text-slate-400 text-sm"
        >
          Showing 12 industries ·{' '}
          <span className="text-slate-600 font-medium">Expanding to 30+ by 2026</span>
        </motion.p>
      </div>
    </section>
  );
}
