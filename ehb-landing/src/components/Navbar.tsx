'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Zap } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Platforms', href: '#platforms' },
  { label: 'PSS Engine', href: '#pss' },
  { label: 'SQ Levels', href: '#sq-levels' },
  { label: 'How It Works', href: '#how-it-works' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleLinkClick(href: string) {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.a
              href="#"
              className="flex items-center gap-2.5 group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25">
                <Zap className="h-4 w-4 text-white fill-white" />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                EHB
              </span>
            </motion.a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <motion.button
                  key={link.label}
                  onClick={() => handleLinkClick(link.href)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {link.label}
                </motion.button>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <motion.a
                href="#platforms"
                className="px-4 py-2 text-sm text-white/70 hover:text-white font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.a>
              <motion.a
                href="#cta"
                className="relative px-5 py-2.5 text-sm font-semibold text-black rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 overflow-hidden group"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/[0.07] px-6 py-6"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleLinkClick(link.href)}
                  className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/[0.06] rounded-xl font-medium transition-all"
                >
                  {link.label}
                </motion.button>
              ))}
              <div className="mt-4 pt-4 border-t border-white/[0.07] flex flex-col gap-2">
                <a
                  href="#"
                  className="px-4 py-3 text-center text-white/70 hover:text-white font-medium rounded-xl hover:bg-white/[0.06] transition-all"
                >
                  Sign In
                </a>
                <a
                  href="#cta"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-center font-semibold text-black rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500"
                >
                  Get Started
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
