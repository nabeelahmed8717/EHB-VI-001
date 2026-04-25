'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Users, Building2, Code2 } from 'lucide-react';

const CTA_CARDS = [
  {
    icon: Users,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    title: 'For Users',
    description: 'Access verified professionals, products, and services across every EHB platform. Your trust score is visible — and so is theirs.',
    cta: 'Join EHB',
    features: ['Verified sellers & providers', 'SQ-scored listings', 'Cross-platform profile', 'Transparent trust scores'],
    featured: false,
  },
  {
    icon: Building2,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    title: 'For Businesses',
    description: 'Register your entity on any EHB platform, go through PSS verification, and earn an SQ Level that signals trust to every customer across the ecosystem.',
    cta: 'List Your Business',
    features: ['PSS verification', 'SQ Level badge', 'Multi-platform reach', 'Franchise support'],
    featured: true,
  },
  {
    icon: Code2,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    title: 'For Developers',
    description: "Build on EHB's trust infrastructure. Integrate PSS into your own platform, use our APIs, and give your users verified SQ Levels from day one.",
    cta: 'View API Docs',
    features: ['PSS REST API', 'SQ webhook events', 'Sandbox environment', 'pss-client SDK'],
    featured: false,
  },
];

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="cta" className="relative overflow-hidden">
      {/* Top cards section */}
      <div className="bg-white section-padding border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6" ref={ref}>
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="section-label mb-5"
            >
              Get Started with EHB
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4"
            >
              Join the trust{' '}
              <span className="gradient-text-cyan">ecosystem.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto max-w-lg text-slate-500 text-base leading-relaxed"
            >
              Whether you are a user, business, or developer — there is a place for you
              in the EHB ecosystem.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {CTA_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.35 + i * 0.1, duration: 0.6 }}
                  className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    card.featured
                      ? 'border-blue-300 bg-gradient-to-b from-blue-50 to-white ring-1 ring-blue-200 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {card.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${card.iconBg} mb-5`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-grow">{card.description}</p>

                  <ul className="space-y-2 mb-6">
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    className={`group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      card.featured
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-200 hover:shadow-blue-300'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {card.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom CTA banner — inspired by Climatiq blue block */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#0EA5E9] py-20 px-6"
      >
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)'
          }}
        />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Get Started With Automated<br className="hidden sm:block" /> Trust Verification.
          </h2>
          <p className="text-blue-100 text-base mb-8 leading-relaxed">
            EHB is live and accepting registrations. PSS deployed · GoSellr, OLS, HPS, JPS active.
          </p>
          <motion.a
            href="#platforms"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-blue-700 bg-white shadow-xl hover:shadow-2xl transition-all text-sm"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.preventDefault(); document.querySelector('#platforms')?.scrollIntoView({ behavior: 'smooth' }); }}
          >
            Explore Platforms
            <ArrowRight className="h-4 w-4" />
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
