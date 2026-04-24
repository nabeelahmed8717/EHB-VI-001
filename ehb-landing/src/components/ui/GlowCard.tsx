'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { clsx } from 'clsx';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  hoverable?: boolean;
}

export default function GlowCard({
  children,
  className,
  glowColor = 'rgba(0,212,255,0.15)',
  intensity = 'medium',
  hoverable = true,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const glowX = useTransform(mouseX, (val) => `${val}px`);
  const glowY = useTransform(mouseY, (val) => `${val}px`);

  const intensityMap = {
    low: '150px',
    medium: '200px',
    high: '280px',
  };

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function handleMouseLeave() {
    mouseX.set(-999);
    mouseY.set(-999);
  }

  return (
    <motion.div
      ref={cardRef}
      className={clsx(
        'relative overflow-hidden rounded-2xl',
        'border border-white/[0.07] bg-white/[0.03]',
        hoverable && 'group cursor-pointer',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={hoverable ? { y: -4, borderColor: 'rgba(255,255,255,0.12)' } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Spotlight glow following cursor */}
      {hoverable && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(${intensityMap[intensity]} circle at ${glowX} ${glowY}, ${glowColor}, transparent)`,
          }}
        />
      )}

      {/* Static border glow on hover */}
      {hoverable && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: `inset 0 0 30px ${glowColor}`,
          }}
        />
      )}

      {children}
    </motion.div>
  );
}
