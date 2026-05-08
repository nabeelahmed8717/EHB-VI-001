/**
 * GoSellr Design System — Single Source of Truth
 * --------------------------------------------------
 * All visual tokens live here. Tailwind reads these via tailwind.config.ts,
 * and globals.css mirrors them as CSS variables for runtime theming.
 *
 * NEVER hard-code colors / sizes / radii in components. Always reference
 * tokens through Tailwind classes (e.g. `text-primary`, `rounded-lg`,
 * `shadow-card`) or via the `theme` export below for inline styles.
 *
 * Design language: clean, modern marketplace. Navy primary + bright blue
 * accent + warm neutrals. Inspired by the emox reference but adapted to
 * GoSellr's identity.
 */

export const theme = {
  /* ---------------------------------------------------------------- */
  /* Color palette — HSL values feed into CSS vars                    */
  /* ---------------------------------------------------------------- */
  colors: {
    // Brand primary (deep navy used in hero panels, promo cards, footer)
    primary: {
      50:  '#EFF4FB',
      100: '#D9E4F4',
      200: '#B3CAE9',
      300: '#7FA4D6',
      400: '#4D7FC0',
      500: '#2A5FA8',
      600: '#1F4A8D',
      700: '#173A72',
      800: '#102A56',
      900: '#0B1E3D', // anchor navy
      950: '#06122A',
    },

    // Action / CTA blue (search button, primary buttons, links)
    accent: {
      50:  '#EBF3FE',
      100: '#D6E6FD',
      200: '#ADCDFB',
      300: '#7DB0F8',
      400: '#4D92F4',
      500: '#1F6FEB', // anchor accent
      600: '#1859BC',
      700: '#13468F',
      800: '#0E3568',
      900: '#0A2647',
    },

    // Warm yellow used for star ratings, banner highlights
    warning: {
      50:  '#FFFAEB',
      100: '#FFF1C7',
      200: '#FFE38A',
      300: '#FFD24D',
      400: '#FFC926',
      500: '#F5B400',
      600: '#C68F00',
      700: '#8F6800',
    },

    // Coral / sale red used for "SALE" tags and limited deals
    danger: {
      50:  '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
    },

    // Trust green for SQ-verified badges, success states
    success: {
      50:  '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
    },

    // Neutrals — page background, surfaces, text
    neutral: {
      0:   '#FFFFFF',
      50:  '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
  },

  /* ---------------------------------------------------------------- */
  /* Typography                                                       */
  /* ---------------------------------------------------------------- */
  typography: {
    fontFamily: {
      sans: 'var(--font-sans, "Inter", ui-sans-serif, system-ui, sans-serif)',
      display: 'var(--font-display, "Inter", ui-sans-serif, system-ui, sans-serif)',
    },
    fontSize: {
      xxs:  ['10px', { lineHeight: '14px' }],
      xs:   ['12px', { lineHeight: '16px' }],
      sm:   ['13px', { lineHeight: '18px' }],
      base: ['14px', { lineHeight: '20px' }],
      md:   ['15px', { lineHeight: '22px' }],
      lg:   ['16px', { lineHeight: '24px' }],
      xl:   ['18px', { lineHeight: '26px' }],
      '2xl':['20px', { lineHeight: '28px' }],
      '3xl':['24px', { lineHeight: '32px' }],
      '4xl':['28px', { lineHeight: '36px' }],
      '5xl':['32px', { lineHeight: '40px' }],
      '6xl':['40px', { lineHeight: '48px' }],
      '7xl':['52px', { lineHeight: '60px' }],
    },
    fontWeight: {
      regular:  '400',
      medium:   '500',
      semibold: '600',
      bold:     '700',
      extrabold:'800',
    },
  },

  /* ---------------------------------------------------------------- */
  /* Spacing scale — 4px grid                                         */
  /* ---------------------------------------------------------------- */
  spacing: {
    px:  '1px',
    0:   '0',
    1:   '4px',
    2:   '8px',
    3:   '12px',
    4:   '16px',
    5:   '20px',
    6:   '24px',
    8:   '32px',
    10:  '40px',
    12:  '48px',
    16:  '64px',
    20:  '80px',
    24:  '96px',
    32:  '128px',
  },

  /* ---------------------------------------------------------------- */
  /* Border radii                                                     */
  /* ---------------------------------------------------------------- */
  radius: {
    none: '0',
    xs:   '4px',
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '20px',
    '2xl':'28px',
    '3xl':'36px',
    pill: '9999px',
  },

  /* ---------------------------------------------------------------- */
  /* Shadows                                                          */
  /* ---------------------------------------------------------------- */
  shadows: {
    xs:    '0 1px 2px rgba(15, 23, 42, 0.04)',
    sm:    '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
    card:  '0 2px 8px rgba(15, 23, 42, 0.06)',
    md:    '0 4px 12px rgba(15, 23, 42, 0.08)',
    lg:    '0 12px 28px rgba(15, 23, 42, 0.10)',
    xl:    '0 24px 48px rgba(15, 23, 42, 0.14)',
    inner: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
    focus: '0 0 0 3px rgba(31, 111, 235, 0.25)',
  },

  /* ---------------------------------------------------------------- */
  /* Layout                                                           */
  /* ---------------------------------------------------------------- */
  layout: {
    container: {
      sm:  '640px',
      md:  '768px',
      lg:  '1024px',
      xl:  '1200px',
      '2xl':'1320px',
    },
    headerHeight: '64px',
    utilityBarHeight: '36px',
  },

  /* ---------------------------------------------------------------- */
  /* Breakpoints                                                      */
  /* ---------------------------------------------------------------- */
  breakpoints: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl':'1536px',
  },

  /* ---------------------------------------------------------------- */
  /* Animation                                                        */
  /* ---------------------------------------------------------------- */
  animation: {
    duration: {
      fast:   '150ms',
      base:   '200ms',
      slow:   '300ms',
      slower: '500ms',
    },
    easing: {
      base:   'cubic-bezier(0.4, 0, 0.2, 1)',
      out:    'cubic-bezier(0, 0, 0.2, 1)',
      in:     'cubic-bezier(0.4, 0, 1, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
} as const;

export type Theme = typeof theme;

/* -------------------------------------------------------------------- */
/* Semantic helpers — use these for non-Tailwind contexts (rare)         */
/* -------------------------------------------------------------------- */
export const semanticColors = {
  textPrimary:    theme.colors.neutral[900],
  textSecondary:  theme.colors.neutral[600],
  textMuted:      theme.colors.neutral[400],
  textInverse:    theme.colors.neutral[0],
  surface:        theme.colors.neutral[0],
  surfaceAlt:     theme.colors.neutral[50],
  surfaceMuted:   theme.colors.neutral[100],
  border:         theme.colors.neutral[200],
  borderStrong:   theme.colors.neutral[300],
  brand:          theme.colors.primary[900],
  brandSurface:   theme.colors.primary[50],
  action:         theme.colors.accent[500],
  actionHover:    theme.colors.accent[600],
  rating:         theme.colors.warning[400],
  sale:           theme.colors.danger[500],
  verified:       theme.colors.success[600],
} as const;
