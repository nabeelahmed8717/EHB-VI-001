import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface PromoTileProps {
  title: string;
  subtitle?: string;
  highlight?: string;
  ctaLabel?: string;
  href: string;
  variant: 'pink' | 'sky' | 'red' | 'green' | 'amber' | 'navy' | 'orange';
  size?: 'md' | 'lg' | 'sm';
}

const VARIANTS: Record<PromoTileProps['variant'], { bg: string; text: string; cta: string }> = {
  pink:   { bg: 'bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500',     text: 'text-white', cta: 'bg-white text-rose-600' },
  sky:    { bg: 'bg-gradient-to-br from-sky-200 via-sky-300 to-sky-400',           text: 'text-slate-900', cta: 'bg-primary text-primary-foreground' },
  red:    { bg: 'bg-gradient-to-br from-rose-600 via-red-600 to-red-700',          text: 'text-white', cta: 'bg-warning text-warning-foreground' },
  green:  { bg: 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500',  text: 'text-white', cta: 'bg-warning text-warning-foreground' },
  amber:  { bg: 'bg-gradient-to-br from-amber-100 via-amber-200 to-orange-200',    text: 'text-slate-900', cta: 'bg-primary text-primary-foreground' },
  navy:   { bg: 'bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500', text: 'text-white', cta: 'bg-white text-primary' },
  orange: { bg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500',    text: 'text-white', cta: 'bg-white text-warning-500' },
};

/**
 * Reusable colorful promo banner card. Used in the mid-page banner row,
 * Ramadan-style wide banner, brand splash banners, etc.
 */
export function PromoTile({
  title,
  subtitle,
  highlight,
  ctaLabel,
  href,
  variant,
  size = 'md',
}: PromoTileProps) {
  const v = VARIANTS[variant];
  const heightClass =
    size === 'lg'
      ? 'h-44 md:h-56 lg:h-64'
      : size === 'sm'
      ? 'h-28 md:h-36'
      : 'h-36 md:h-44';

  return (
    <Link
      href={href}
      className={`group relative block rounded-2xl overflow-hidden ${v.bg} ${heightClass}`}
    >
      <div className={`relative h-full p-5 md:p-6 flex flex-col justify-between ${v.text}`}>
        <div className="space-y-1">
          {subtitle && (
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-80">
              {subtitle}
            </p>
          )}
          <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight max-w-[80%]">
            {title}
          </h3>
          {highlight && (
            <p className="text-2xl md:text-3xl font-extrabold pt-1">{highlight}</p>
          )}
        </div>

        {ctaLabel && (
          <span
            className={`inline-flex items-center gap-1.5 self-start text-xs font-semibold px-3.5 py-1.5 rounded-pill ${v.cta} shadow-xs`}
          >
            {ctaLabel}
            <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Decorative blur shapes */}
      <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-white/15 blur-2xl pointer-events-none" />
      <div className="absolute -top-10 -left-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
    </Link>
  );
}
