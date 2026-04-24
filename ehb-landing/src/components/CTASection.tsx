'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Users, Building2, Code2 } from 'lucide-react';

const CTA_CARDS = [
  {
    icon: Users,
    iconColor: 'text-cyan-400',
    gradient: 'from-cyan-500/15 via-transparent',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    glow: 'rgba(0,212,255,0.15)',
    title: 'For Users',
    description:
      'Access verified professionals, products, and services across every EHB platform. Your trust score is visible — and so is theirs.',
    cta: 'Join EHB',
    features: ['Verified sellers & providers', 'SQ-scored listings', 'Cross-platform profile', 'Transparent trust scores'],
  },
  {
    icon: Building2,
    iconColor: 'text-blue-400',
    gradient: 'from-blue-500/15 via-transparent',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    glow: 'rgba(59,130,246,0.15)',
    title: 'For Businesses',
    description:
      'Register your entity on any EHB platform, go through PSS verification, and earn an SQ Level that signals trust to every customer across the ecosystem.',
    cta: 'List Your Business',
    features: ['PSS verification', 'SQ Level badge', 'Multi-platform reach', 'Franchise support'],
    featured: true,
  },
  {
    icon: Code2,
    iconColor: 'text-purple-400',
    gradient: 'from-purple-500/15 via-transparent',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    glow: 'rgba(139,92,246,0.15)',
    title: 'For Developers',
    description:
      'Build on EHB\'s trust infrastructure. Integrate PSS into your own platform, use our APIs, and give your users verified SQ Levels from day one.',
    cta: 'View API Docs',
    features: ['PSS REST API', 'SQ webhook events', 'Sandbox environment', 'pss-client SDK'],
  },
];

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="cta" className="relative section-padding overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-600/[0.03] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-radial from-blue-600/[0.06] to-transparent blur-[80px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-widest mb-5"
          >
            Get Started with EHB
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5"
          >
            Join the trust{' '}
            <span className="gradient-text-cyan">ecosystem.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-lg text-white/45 text-lg leading-relaxed"
          >
            Whether you are a user, business, or developer — there is a place for you
            in the EHB ecosystem.
          </motion.p>
        </div>

        {/* CTA Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {CTA_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`relative group flex flex-col p-7 rounded-2xl border ${card.border} bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 ${
                  card.featured ? 'ring-1 ring-blue-500/20' : ''
                }`}
                style={{ cursor: 'default' }}
              >
                {/* Featured label */}
                {card.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${card.glow}, transparent 60%)` }}
                />

                {/* Top gradient */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${card.gradient} to-transparent rounded-t-2xl pointer-events-none`} />

                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="relative z-10 font-display text-xl font-bold text-white mb-2">{card.title}</h3>

                {/* Description */}
                <p className="relative z-10 text-white/45 text-sm leading-relaxed mb-6 flex-grow">
                  {card.description}
                </p>

                {/* Feature list */}
                <ul className="relative z-10 space-y-2 mb-7">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-white/55">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full border border-white/15 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  className={`relative z-10 group/btn flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    card.featured
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.1 }}
          className="mt-10 text-center text-white/25 text-sm"
        >
          EHB is live and accepting registrations ·{' '}
          <span className="text-white/40">PSS deployed · GoSellr, OLS, HPS, JPS active</span>
        </motion.div>
      </div>
    </section>
  );
}
