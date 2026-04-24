'use client';

import { motion } from 'framer-motion';
import { Zap, Twitter, Github, Linkedin, Mail } from 'lucide-react';

const FOOTER_LINKS = {
  Platforms: [
    { label: 'GoSellr', href: '#' },
    { label: 'OLS', href: '#' },
    { label: 'HPS', href: '#' },
    { label: 'JPS', href: '#' },
    { label: 'WMS', href: '#' },
    { label: 'OBS', href: '#' },
  ],
  Technology: [
    { label: 'PSS Engine', href: '#pss' },
    { label: 'SQ Levels', href: '#sq-levels' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'API Docs', href: '#' },
    { label: 'Architecture', href: '#' },
  ],
  Company: [
    { label: 'About EHB', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Press Kit', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Security', href: '#' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: '#', label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Top row: Logo + Social */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12 pb-12 border-b border-white/[0.06]">
          {/* Logo + tagline */}
          <div>
            <a href="#" className="flex items-center gap-2.5 mb-3 group w-fit">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25">
                <Zap className="h-4.5 w-4.5 text-white fill-white" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-white">EHB</span>
            </a>
            <p className="text-white/35 text-sm max-w-xs leading-relaxed">
              Education Health Business — the trust infrastructure
              for every industry, powered by PSS.
            </p>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white/60 text-xs uppercase tracking-widest mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/35 hover:text-white/75 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white/25 text-xs">
            <span>© 2026 EHB — Education Health Business</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">All rights reserved</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/25">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              PSS Engine Operational
            </span>
            <span>·</span>
            <span>Deployed on ehb.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
