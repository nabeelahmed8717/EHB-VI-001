/**
 * EHB Design System — Color Tokens
 * All UI colors must be sourced from here. No hardcoded hex values in components.
 */

export const colors = {
  /* ── Backgrounds ─────────────────────────────── */
  bg: {
    page:    '#141414',   // root page background
    sidebar: '#1D1D1D',   // sidebar, header, right panel
    card:    '#282828',   // cards, panels, surfaces
    input:   '#323232',   // input fields, search
    hover:   '#333333',   // hover state on interactive items
    active:  '#383838',   // active/selected nav item bg
  },

  /* ── Borders ─────────────────────────────────── */
  border: {
    subtle:  'rgba(255,255,255,0.06)',  // default card/panel border
    medium:  'rgba(255,255,255,0.10)',  // stronger divider
    dashed:  'rgba(255,255,255,0.12)',  // placeholder dashed border
  },

  /* ── Text ────────────────────────────────────── */
  text: {
    primary:   '#F0F0F0',  // headings, active labels
    secondary: '#C0C0C0',  // body, descriptions
    muted:     '#a4a4a4',  // placeholders, disabled
    inverse:   '#141414',  // text on light bg
  },

  /* ── Icons ───────────────────────────────────── */
  icon: {
    active:   '#B59BF5',  // active nav icon
    inactive: '#555555',  // default nav icon
    muted:    '#404040',  // very subtle icon
  },

  /* ── Nav ─────────────────────────────────────── */
  nav: {
    activeBg:   '#383838',
    activeText: '#F0F0F0',
    inactiveText: '#9c9c9c',
  },

  /* ── Accent (single, minimal) ────────────────── */
  accent: {
    DEFAULT: '#505050',   // buttons, focus rings
    hover:   '#5E5E5E',
    text:    '#E0E0E0',
  },

  /* ── Semantic ───────────────────────────────── */
  semantic: {
    success: '#4CAF50',
    warning: '#F59E0B',
    danger:  '#EF4444',
    info:    '#60A5FA',
  },

  /* ── Progress ring colors (right sidebar) ────── */
  progress: ['#C0C0C0', '#A0A0A0', '#808080', '#606060', '#E0E0E0'],
} as const;
