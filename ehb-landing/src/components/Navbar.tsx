'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Platforms', href: '#platforms', hasDropdown: true },
  { label: 'PSS Engine', href: '#pss', hasDropdown: true },
  { label: 'SQ Levels', href: '#sq-levels', hasDropdown: false },
  { label: 'How It Works', href: '#how-it-works', hasDropdown: false },
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
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
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
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-blue-500/20">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                EHB
              </span>
            </motion.a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <motion.button
                  key={link.label}
                  onClick={() => handleLinkClick(link.href)}
                  className="flex items-center gap-1 px-3.5 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/80 transition-all duration-150 font-medium"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {link.label}
                  {link.hasDropdown && (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 mt-px" />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-2">
              <motion.a
                href="#"
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors rounded-lg hover:bg-slate-100/80"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Log in
              </motion.a>
              <motion.a
                href="#cta"
                className="px-5 py-2 text-sm font-semibold text-white rounded-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Get started
              </motion.a>
            </div>

            {/* Mobile Toggle */}
            <motion.button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white backdrop-blur-xl border-b border-slate-200 shadow-lg px-6 py-5"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleLinkClick(link.href)}
                  className="flex items-center justify-between w-full px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium transition-all text-sm"
                >
                  <span>{link.label}</span>
                  {link.hasDropdown && <ChevronDown className="h-4 w-4 text-slate-400" />}
                </motion.button>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <a href="#" className="px-4 py-2.5 text-center text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all">
                  Log in
                </a>
                <a href="#cta" onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-center text-sm font-semibold text-white rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Get started
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
