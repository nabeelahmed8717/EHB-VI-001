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
  glowColor = 'rgba(14,165,233,0.07)',
  intensity = 'medium',
  hoverable = true,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useTransform(mouseX, (val) => `${val}px`);
  const glowY = useTransform(mouseY, (val) => `${val}px`);
  const intensityMap = { low: '160px', medium: '220px', high: '300px' };

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
        'bg-white border border-slate-200',
        hoverable && 'group cursor-pointer',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={hoverable ? { y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.09)', borderColor: '#CBD5E1' } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {hoverable && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(${intensityMap[intensity]} circle at ${glowX} ${glowY}, ${glowColor}, transparent)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
