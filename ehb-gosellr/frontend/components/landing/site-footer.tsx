import Link from 'next/link';
import { Mail, Phone, ShieldCheck } from 'lucide-react';

const COL_PRODUCTS = [
  { label: 'Browse All', href: '/browse' },
  { label: 'Best Deals', href: '/browse?deals=1' },
  { label: 'New Arrivals', href: '/browse?sort=new' },
  { label: 'Brand Stores', href: '/browse?brand=all' },
];

const COL_HELP = [
  { label: 'My Orders', href: '/orders' },
  { label: 'Track Delivery', href: '/orders' },
  { label: 'Returns', href: '/help/returns' },
  { label: 'Contact Us', href: '/help/contact' },
];

const COL_SELL = [
  { label: 'Become a Seller', href: '/register' },
  { label: 'SQ Verification', href: '/dashboard/sq-status' },
  { label: 'Become a Rider', href: '/register' },
  { label: 'Seller Hub', href: '/dashboard' },
];

const COL_COMPANY = [
  { label: 'About EHB', href: '/about' },
  { label: 'Trust & Safety', href: '/trust' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 md:mt-20 bg-primary-900 text-primary-100">
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 py-12 md:py-14">
        {/* Top — wordmark + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-2xl font-extrabold tracking-tight text-white lowercase">
                gosellr
              </span>
              <span className="flex flex-col gap-0.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-pill bg-accent" />
                <span className="w-1.5 h-1.5 rounded-pill bg-accent" />
              </span>
            </div>
            <p className="text-sm text-primary-200 leading-relaxed max-w-md mb-5">
              GoSellr is the trusted marketplace built on EHB&apos;s Seller
              Qualification (SQ) trust infrastructure. Every seller verified.
              Every product qualified.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-300" />
              SQ-verified marketplace by EHB Technologies
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-200">
              <Mail className="w-3.5 h-3.5 text-accent-300" />
              support@gosellr.app
              <span className="mx-2 opacity-40">·</span>
              <Phone className="w-3.5 h-3.5 text-accent-300" />
              0800-GO-SELLR
            </div>
          </div>

          <FooterColumn title="Products" links={COL_PRODUCTS} />
          <FooterColumn title="Help" links={COL_HELP} />
          <FooterColumn title="Sell on GoSellr" links={COL_SELL} />
        </div>

        <div className="mt-10 md:mt-12 pt-6 border-t border-primary-800 grid md:grid-cols-2 gap-4">
          <div className="text-xs text-primary-300">
            © {new Date().getFullYear()} GoSellr · Part of{' '}
            <span className="text-accent-300 font-semibold">EHB Technologies</span> · Education · Health · Business
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:justify-end text-xs text-primary-300">
            {COL_COMPANY.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-primary-200 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
