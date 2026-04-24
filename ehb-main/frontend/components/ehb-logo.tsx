import { Shield } from 'lucide-react';

interface EhbLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 'h-6 w-6', text: 'text-lg' },
  md: { icon: 'h-8 w-8', text: 'text-2xl' },
  lg: { icon: 'h-12 w-12', text: 'text-3xl' },
};

export function EhbLogo({ size = 'md' }: EhbLogoProps) {
  const s = sizes[size];
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="rounded-xl bg-primary p-2">
        <Shield className={`${s.icon} text-white`} />
      </div>
      <span className={`${s.text} font-bold tracking-tight text-gray-900`}>
        EHB
      </span>
    </div>
  );
}
