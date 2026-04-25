'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Upload, Cpu, BadgeCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Upload,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 border-cyan-200',
    title: 'Submit Your Entity',
    description: 'A user registers a product, profile, or service on any EHB platform and clicks "Send for Approval". PSS receives the submission and classifies it.',
    details: ['Store listing', 'Doctor profile', 'Legal case', 'Job posting'],
    accentColor: '#0EA5E9',
  },
  {
    step: '02',
    icon: Cpu,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-200',
    title: 'PSS Verification',
    description: 'PSS loads the platform-specific criteria set, checks how many criteria the entity satisfies, calculates an SQ score, and routes to: auto-approve, Franchise review, or EDR escalation.',
    details: ['Identity check', 'Criteria scoring', 'Risk assessment', 'Route decision'],
    accentColor: '#2563EB',
  },
  {
    step: '03',
    icon: BadgeCheck,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200',
    title: 'SQ Level Assigned',
    description: 'PSS assigns the final SQ Level — from SQ1 to SQ10. The entity becomes activated on the platform. Every decision is permanently logged in the audit trail.',
    details: ['SQ1 – SQ10 assigned', 'Entity activated', 'Audit logged', 'Trust visible'],
    accentColor: '#7C3AED',
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="relative section-padding bg-[#F7F9FF]">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-label mb-5"
          >
            The 9-Step Trust Flow
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4"
          >
            How trust gets{' '}
            <span className="gradient-text-cyan">assigned.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-lg text-slate-500 text-base leading-relaxed"
          >
            A standardized 9-step verification flow ensures every entity on every EHB platform
            receives a fair, auditable, and accurate trust score.
          </motion.p>
        </div>

        <div className="relative">
          {/* Desktop connecting line */}
          <div className="hidden md:block absolute top-[46px] left-[16.67%] right-[16.67%] h-[1px]">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-25"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.5 }}
              style={{ transformOrigin: 'left' }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
                  className="relative flex flex-col bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border ${step.iconBg}`}>
                        <Icon className={`h-5 w-5 ${step.iconColor}`} />
                      </div>
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                        style={{ background: step.accentColor }}>
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 leading-tight">{step.title}</h3>
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed mb-5">{step.description}</p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {step.details.map((detail) => (
                      <span key={detail} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
                        {detail}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.0 }}
          className="mt-12 p-5 rounded-2xl border border-blue-200 bg-blue-50 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 border border-blue-200">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-0.5">No silent rejections — ever.</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every SQ decision — whether approved, conditional, or rejected — writes a permanent,
              auditable reason to the EHB audit log. Transparency is not optional.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
