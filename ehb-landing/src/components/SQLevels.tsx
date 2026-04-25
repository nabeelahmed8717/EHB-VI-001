'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { SQ_LEVELS } from '@/lib/platforms';

export default function SQLevels() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="sq-levels" className="relative section-padding bg-white">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left: Text */}
          <div className="sticky top-28">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="section-label mb-5"
            >
              SQ Level System
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 leading-tight"
            >
              Trust you can{' '}
              <span className="gradient-text-cyan">see and measure.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-500 text-base leading-relaxed mb-8"
            >
              Every entity on every EHB platform carries a verifiable SQ Level —
              from SQ1 (basic identity) to SQ10 (elite certified). The score is
              per entity, not per user. Transparent. Auditable. Real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-2.5"
            >
              {[
                { icon: '🏷️', text: 'SQ is per entity, not per user' },
                { icon: '🔗', text: 'One user, 5 products = 5 separate SQ levels' },
                { icon: '📋', text: 'Every SQ record: user_id + platform_id + entity_id' },
                { icon: '🌐', text: 'Consistent across all 30+ platforms' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-sm text-slate-600 leading-relaxed">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: SQ Level Timeline */}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-100" />
            <motion.div
              className="absolute left-6 top-0 w-[1px] bg-gradient-to-b from-cyan-400 to-purple-500"
              initial={{ height: 0 }}
              animate={isInView ? { height: '100%' } : {}}
              transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
              style={{ originY: 0 }}
            />

            <div className="space-y-4 pl-14 relative">
              {SQ_LEVELS.map((sq, i) => (
                <motion.div
                  key={sq.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                  className="relative group"
                >
                  <div
                    className="absolute -left-[2.15rem] flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white transition-all group-hover:scale-110 shadow-sm"
                    style={{ borderColor: sq.color }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: sq.color }} />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <span className="font-display text-xl font-black tracking-tight" style={{ color: sq.color }}>
                          {sq.label}
                        </span>
                        <h4 className="font-semibold text-slate-800 text-sm mt-0.5">{sq.title}</h4>
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <div
                            key={j}
                            className="h-3.5 w-1 rounded-full"
                            style={{
                              background: j < sq.level ? sq.color : '#E2E8F0',
                              opacity: j < sq.level ? 0.85 : 1,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{sq.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
