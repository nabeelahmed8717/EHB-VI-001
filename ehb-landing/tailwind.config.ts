import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ehb: {
          bg: '#000008',
          card: 'rgba(255,255,255,0.03)',
          border: 'rgba(255,255,255,0.07)',
          cyan: '#00D4FF',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          pink: '#EC4899',
        },
      },
      fontFamily: {
        sans: ['Google Sans', 'var(--font-noto-sans)', 'Arial', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,0.18), transparent 70%)',
        'glow-cyan':
          'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,212,255,0.12), transparent)',
        'glow-purple':
          'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.12), transparent)',
      },
      backgroundSize: {
        grid: '60px 60px',
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'float-slow': 'float 10s ease-in-out 1s infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        orbit: 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit 25s linear reverse infinite',
        'draw-line': 'drawLine 2s ease-out forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-15px) rotate(1deg)' },
          '66%': { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0,212,255,0.25), 0 0 60px rgba(0,212,255,0.1)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0,212,255,0.5), 0 0 100px rgba(0,212,255,0.2)',
          },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(160px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(160px) rotate(-360deg)' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
