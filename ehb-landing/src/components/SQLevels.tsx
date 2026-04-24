'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { SQ_LEVELS } from '@/lib/platforms';

export default function SQLevels() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="sq-levels" className="relative section-padding">
      {/* BG glow */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[600px] bg-cyan-500/[0.03] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left: Text */}
          <div className="sticky top-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-widest mb-5"
            >
              SQ Level System
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-tight"
            >
              Trust you can{' '}
              <span className="gradient-text-cyan">see and measure.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/45 text-lg leading-relaxed mb-8"
            >
              Every entity on every EHB platform carries a verifiable SQ Level —
              from SQ1 (basic identity) to SQ10 (elite certified). The score is
              per entity, not per user. Transparent. Auditable. Real.
            </motion.p>

            {/* Key rule callout */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-3"
            >
              {[
                { icon: '🏷️', text: 'SQ is per entity, not per user' },
                { icon: '🔗', text: 'One user, 5 products = 5 separate SQ levels' },
                { icon: '📋', text: 'Every SQ record: user_id + platform_id + entity_id' },
                { icon: '🌐', text: 'Consistent across all 30+ platforms' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-sm text-white/55 leading-relaxed">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: SQ Level Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
            <motion.div
              className="absolute left-6 top-0 w-[1px] bg-gradient-to-b from-cyan-500 to-purple-500"
              initial={{ height: 0 }}
              animate={isInView ? { height: '100%' } : {}}
              transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
              style={{ originY: 0 }}
            />

            <div className="space-y-6 pl-16 relative">
              {SQ_LEVELS.map((sq, i) => (
                <motion.div
                  key={sq.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative group"
                >
                  {/* Node on timeline */}
                  <div
                    className="absolute -left-[2.65rem] flex items-center justify-center w-6 h-6 rounded-full border-2 bg-[#000008] transition-all group-hover:scale-110"
                    style={{ borderColor: sq.color, boxShadow: `0 0 12px ${sq.color}40` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: sq.color }} />
                  </div>

                  {/* Card */}
                  <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span
                          className="font-display text-2xl font-black tracking-tight"
                          style={{ color: sq.color }}
                        >
                          {sq.label}
                        </span>
                        <h4 className="font-semibold text-white text-sm mt-0.5">{sq.title}</h4>
                      </div>
                      {/* Level progress bar */}
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <div
                            key={j}
                            className="h-4 w-1 rounded-full"
                            style={{
                              background: j < sq.level ? sq.color : 'rgba(255,255,255,0.07)',
                              opacity: j < sq.level ? 0.8 + j * 0.02 : 0.3,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/40 text-sm leading-relaxed">{sq.description}</p>
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
