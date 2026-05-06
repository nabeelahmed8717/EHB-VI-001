/**
 * EHB Design System — Color Tokens
 * Palette matched to Stakent reference image.
 * All UI colors must be sourced from here. No hardcoded hex values in components.
 */

export const colors = {
  /* ── Backgrounds — Stakent exact palette ────────────────────── */
  bg: {
    page:    '#05060F',   // main content area — dark navy-charcoal
    sidebar: '#05060F',   // sidebar, slightly darker than page
    card:    '#11121B',   // elevated card surfaces
    input:   '#252538',   // input fields, search boxes
    hover:   '#23243A',   // hover state on interactive items
    active:  '#1E2035',   // active/selected nav item bg
  },

  /* ── Borders ─────────────────────────────────── */
  border: {
    subtle:  'rgba(255,255,255,0.06)',
    medium:  'rgba(255,255,255,0.09)',
    dashed:  'rgba(124,110,255,0.25)',
    accent:  'rgba(124,110,255,0.45)',
  },

  /* ── Text ────────────────────────────────────── */
  text: {
    primary:   '#f1f1f1',   // headings, active labels
    secondary: '#8890AA',   // body, descriptions
    muted:     '#8c8c8c',   // placeholders, disabled
    inverse:   '#13141F',   // text on light bg
  },

  /* ── Icons ───────────────────────────────────── */
  icon: {
    active:   '#ffffff',   // active nav icon — light lavender
    inactive: '#7A787B',   // default nav icon
    muted:    '#2E3048',   // very subtle
  },

  /* ── Nav ─────────────────────────────────────── */
  nav: {
    activeBg:     '#22243C',   // active nav item bg (elevated)
    activeBorder: '#7C6EFF',   // purple left indicator
    activeText:   '#F0F1F8',   // active label
    inactiveText: '#7A787B',   // inactive label
  },

  /* ── Accent — Stakent "Deposit" button style ─── */
  accent: {
    DEFAULT: '#C4B5FD',              // light lavender fill
    hover:   '#D0C4FF',
    muted:   'rgba(124,110,255,0.15)',
    text:    '#160D30',              // dark text on lavender
    purple:  '#7C6EFF',              // pure purple for borders / rings
  },

  /* ── Semantic ───────────────────────────────── */
  semantic: {
    success: '#4CAF50',
    warning: '#F59E0B',
    danger:  '#EF4444',
    info:    '#60A5FA',
  },

  /* ── Progress ring colors ────────────────────── */
  progress: ['#7C6EFF', '#B59BF5', '#60A5FA', '#4CAF50', '#F59E0B'],
} as const;
