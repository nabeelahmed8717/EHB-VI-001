'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Upload, Cpu, BadgeCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Upload,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    lineColor: 'from-cyan-500 to-blue-500',
    title: 'Submit Your Entity',
    description:
      'A user registers a product, profile, or service on any EHB platform and clicks "Send for Approval". PSS receives the submission and classifies it.',
    details: ['Store listing', 'Doctor profile', 'Legal case', 'Job posting'],
  },
  {
    step: '02',
    icon: Cpu,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    lineColor: 'from-blue-500 to-purple-500',
    title: 'PSS Verification',
    description:
      'PSS loads the platform-specific criteria set, checks how many criteria the entity satisfies, calculates an SQ score, and routes to: auto-approve, Franchise review, or EDR escalation.',
    details: ['Identity check', 'Criteria scoring', 'Risk assessment', 'Route decision'],
  },
  {
    step: '03',
    icon: BadgeCheck,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    lineColor: 'from-purple-500 to-pink-500',
    title: 'SQ Level Assigned',
    description:
      'PSS assigns the final SQ Level — from SQ1 to SQ10. The entity becomes activated on the platform. Every decision is permanently logged in the audit trail.',
    details: ['SQ1 – SQ10 assigned', 'Entity activated', 'Audit logged', 'Trust visible'],
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="relative section-padding">
      {/* BG Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/[0.04] blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-widest mb-5"
          >
            The 9-Step Trust Flow
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5"
          >
            How trust gets{' '}
            <span className="gradient-text-cyan">assigned.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-lg text-white/45 text-lg leading-relaxed"
          >
            A standardized 9-step verification flow ensures every entity on every EHB platform
            receives a fair, auditable, and accurate trust score.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-[1px]">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-30"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
              style={{ transformOrigin: 'left' }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col"
                >
                  {/* Connector line (mobile) */}
                  {i < STEPS.length - 1 && (
                    <div className="md:hidden absolute left-[26px] top-[52px] w-[1px] h-full bg-gradient-to-b from-cyan-500/30 to-transparent" />
                  )}

                  {/* Step number + icon */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div
                        className={`flex items-center justify-center w-[52px] h-[52px] rounded-2xl border ${step.iconBg} z-10 relative`}
                      >
                        <Icon className={`h-6 w-6 ${step.iconColor}`} />
                      </div>
                      {/* Step number */}
                      <span className="absolute -top-2 -right-2 font-display text-[10px] font-black text-white/20 leading-none">
                        {step.step}
                      </span>
                    </div>

                    {/* Step title */}
                    <h3 className="font-display text-lg font-bold text-white leading-tight">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-white/50 text-sm leading-relaxed mb-4 pl-0">
                    {step.description}
                  </p>

                  {/* Detail tags */}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {step.details.map((detail) => (
                      <span
                        key={detail}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-medium"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-16 p-6 rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80 mb-1">No silent rejections — ever.</p>
            <p className="text-sm text-white/40 leading-relaxed">
              Every SQ decision — whether approved, conditional, or rejected — writes a permanent,
              auditable reason to the EHB audit log. Transparency is not optional.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
