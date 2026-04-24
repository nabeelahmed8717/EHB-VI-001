'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Globe, ShieldCheck, BarChart3 } from 'lucide-react';
import GlowCard from './ui/GlowCard';

const CONCEPTS = [
  {
    icon: Globe,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    glowColor: 'rgba(0,212,255,0.12)',
    title: 'Umbrella Platform',
    subtitle: '30+ services. One home.',
    description:
      'EHB is not a single product — it is the parent company that owns and governs a growing ecosystem of industry-specific service platforms. Each platform operates independently, yet is unified under EHB&apos;s trust infrastructure.',
    tags: ['E-Commerce', 'Healthcare', 'Legal', 'Employment', '+26 more'],
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    glowColor: 'rgba(59,130,246,0.12)',
    title: 'PSS Trust Engine',
    subtitle: 'The verification backbone.',
    description:
      'PSS (Platform Security System) is the central brain of EHB. It handles identity validation, credential verification, risk scoring, and fraud detection — across every platform, every entity, every transaction.',
    tags: ['Identity Verified', 'Fraud Detection', 'Risk Scoring', 'Audit Trail'],
  },
  {
    icon: BarChart3,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    glowColor: 'rgba(139,92,246,0.12)',
    title: 'SQ Trust Scores',
    subtitle: 'Trust you can measure.',
    description:
      'Every entity on every EHB platform receives a verified SQ Level — from SQ1 (basic identity) to SQ10 (elite certified). Trust is not a claim; it is a score, audited and transparent, assigned per entity.',
    tags: ['SQ1 — SQ10', 'Per Entity', 'Cross-Platform', 'Fully Audited'],
  },
];

export default function WhatIsEHB() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="relative section-padding" id="what-is-ehb">
      {/* Section glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/[0.04] blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-widest mb-5"
          >
            What is EHB
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5"
          >
            One platform.{' '}
            <span className="gradient-text-cyan">Every industry.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-xl text-lg text-white/45 leading-relaxed"
          >
            EHB (Education Health Business) is a centralized multi-industry trust infrastructure.
            Every platform it governs runs on a single verification engine — PSS.
          </motion.p>
        </div>

        {/* Concept cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {CONCEPTS.map((concept, i) => {
            const Icon = concept.icon;
            return (
              <motion.div
                key={concept.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlowCard glowColor={concept.glowColor} className="p-8 h-full">
                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${concept.iconBg} mb-6`}
                  >
                    <Icon className={`h-6 w-6 ${concept.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl font-bold text-white mb-1">
                    {concept.title}
                  </h3>
                  <p className="text-sm font-medium text-white/40 mb-4">{concept.subtitle}</p>

                  {/* Description */}
                  <p
                    className="text-white/55 text-sm leading-relaxed mb-6"
                    dangerouslySetInnerHTML={{ __html: concept.description }}
                  />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {concept.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/50 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
