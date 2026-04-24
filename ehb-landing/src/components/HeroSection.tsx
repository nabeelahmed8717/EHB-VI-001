'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import ParticleBackground from './ui/ParticleBackground';

const FLOATING_BADGES = [
  { label: 'PSS Verified', icon: '⚡', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', delay: 0 },
  { label: 'SQ10 Certified', icon: '🏆', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', delay: 0.4 },
  { label: 'GoSellr', icon: '🛒', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', delay: 0.8 },
  { label: 'Healthcare', icon: '🏥', color: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', delay: 1.2 },
  { label: 'Legal Pro', icon: '⚖️', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', delay: 1.6 },
  { label: '30+ Platforms', icon: '🌐', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30', delay: 2 },
];

const HEADLINE_WORDS = ['The', 'Trust', 'Infrastructure', 'for', 'Everything'];

export default function HeroSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.4], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden grid-bg"
    >
      {/* ── Background layers ── */}
      <ParticleBackground count={55} />

      {/* Hero glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/[0.05] blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/[0.05] blur-[100px]" />
      </div>

      {/* Radial vignette at top */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-radial from-cyan-500/[0.07] via-transparent to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto max-w-5xl px-6 text-center"
      >
        {/* Badge pill */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-400 text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          Now live — PSS Trust Engine v2.0
        </motion.div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              key={word + i}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.7,
                delay: 0.2 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`inline-block mr-[0.25em] last:mr-0 ${
                i === 1 || i === 2
                  ? 'gradient-text-cyan'
                  : 'text-white'
              }`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="mx-auto max-w-2xl text-lg md:text-xl text-white/55 leading-relaxed mb-10"
        >
          EHB governs{' '}
          <span className="text-white/85 font-medium">30+ independent service platforms</span>{' '}
          across every industry through one unified verification engine — PSS.
          Every entity. Every platform. One trust score.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <motion.a
            href="#platforms"
            className="group relative flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-blue-500 overflow-hidden shadow-lg shadow-cyan-500/20"
            whileHover={{ scale: 1.04, shadow: '0 20px 40px rgba(0,212,255,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#platforms')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="relative z-10">Explore Platforms</span>
            <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.a>

          <motion.a
            href="#how-it-works"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white/80 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/[0.04] transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Shield className="h-4 w-4 text-white/50" />
            How It Works
          </motion.a>
        </motion.div>

        {/* Floating platform badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-2.5"
        >
          {FLOATING_BADGES.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.08, type: 'spring', stiffness: 400 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${badge.border} bg-gradient-to-r ${badge.color} text-white/70 text-xs font-medium backdrop-blur-sm`}
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-xs font-medium tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-[1px] h-8 bg-gradient-to-b from-white/30 to-transparent"
        />
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#000008] to-transparent pointer-events-none" />
    </section>
  );
}
