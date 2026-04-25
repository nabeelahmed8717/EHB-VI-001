'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Globe, ShieldCheck, BarChart3 } from 'lucide-react';
import GlowCard from './ui/GlowCard';

const CONCEPTS = [
  {
    icon: Globe,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 border-cyan-200',
    glowColor: 'rgba(14,165,233,0.06)',
    title: 'Umbrella Platform',
    subtitle: '30+ services. One home.',
    description: 'EHB is not a single product — it is the parent company that owns and governs a growing ecosystem of industry-specific service platforms. Each platform operates independently, yet is unified under EHB&apos;s trust infrastructure.',
    tags: ['E-Commerce', 'Healthcare', 'Legal', 'Employment', '+26 more'],
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-200',
    glowColor: 'rgba(37,99,235,0.06)',
    title: 'PSS Trust Engine',
    subtitle: 'The verification backbone.',
    description: 'PSS (Platform Security System) is the central brain of EHB. It handles identity validation, credential verification, risk scoring, and fraud detection — across every platform, every entity, every transaction.',
    tags: ['Identity Verified', 'Fraud Detection', 'Risk Scoring', 'Audit Trail'],
  },
  {
    icon: BarChart3,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200',
    glowColor: 'rgba(124,58,237,0.06)',
    title: 'SQ Trust Scores',
    subtitle: 'Trust you can measure.',
    description: 'Every entity on every EHB platform receives a verified SQ Level — from SQ1 (basic identity) to SQ10 (elite certified). Trust is not a claim; it is a score, audited and transparent, assigned per entity.',
    tags: ['SQ1 — SQ10', 'Per Entity', 'Cross-Platform', 'Fully Audited'],
  },
];

export default function WhatIsEHB() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="relative section-padding bg-white" id="what-is-ehb">
      <div className="mx-auto max-w-6xl px-6">
        <div ref={ref} className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-label mb-5"
          >
            What is EHB
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4"
          >
            One platform.{' '}
            <span className="gradient-text-cyan">Every industry.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-xl text-base text-slate-500 leading-relaxed"
          >
            EHB (Education Health Business) is a centralized multi-industry trust infrastructure.
            Every platform it governs runs on a single verification engine — PSS.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {CONCEPTS.map((concept, i) => {
            const Icon = concept.icon;
            return (
              <motion.div
                key={concept.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlowCard glowColor={concept.glowColor} className="p-7 h-full shadow-sm">
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border ${concept.iconBg} mb-5`}>
                    <Icon className={`h-5 w-5 ${concept.iconColor}`} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-1">{concept.title}</h3>
                  <p className="text-sm font-medium text-slate-400 mb-3">{concept.subtitle}</p>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: concept.description }} />
                  <div className="flex flex-wrap gap-2">
                    {concept.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
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
