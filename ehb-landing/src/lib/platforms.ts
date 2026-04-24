export type PlatformStatus = 'live' | 'beta' | 'coming-soon';

export interface Platform {
  id: string;
  name: string;
  shortName: string;
  description: string;
  industry: string;
  icon: string;
  color: string;
  gradient: string;
  status: PlatformStatus;
  sqMax: number;
}

export const PLATFORMS: Platform[] = [
  // ── Core Infrastructure ──
  {
    id: 'pss',
    name: 'PSS',
    shortName: 'PSS',
    description: 'Central verification & SQ trust engine powering every platform',
    industry: 'Core Infrastructure',
    icon: '⚡',
    color: '#00D4FF',
    gradient: 'from-cyan-500 to-blue-600',
    status: 'live',
    sqMax: 10,
  },
  // ── Active Platforms ──
  {
    id: 'gosellr',
    name: 'GoSellr',
    shortName: 'GoSellr',
    description: 'Verified e-commerce marketplace with trust-scored products',
    industry: 'E-Commerce',
    icon: '🛒',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-600',
    status: 'live',
    sqMax: 10,
  },
  {
    id: 'ols',
    name: 'OLS',
    shortName: 'OLS',
    description: 'Verified legal professional marketplace & case management',
    industry: 'Legal',
    icon: '⚖️',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-600',
    status: 'live',
    sqMax: 10,
  },
  {
    id: 'hps',
    name: 'HPS',
    shortName: 'HPS',
    description: 'Certified healthcare professionals & medical listings',
    industry: 'Healthcare',
    icon: '🏥',
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-600',
    status: 'live',
    sqMax: 10,
  },
  {
    id: 'jps',
    name: 'JPS',
    shortName: 'JPS',
    description: 'Workforce & employment platform with verified candidates',
    industry: 'Employment',
    icon: '💼',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-600',
    status: 'live',
    sqMax: 10,
  },
  {
    id: 'wms',
    name: 'WMS',
    shortName: 'WMS',
    description: 'Hospital & clinic management with compliance scoring',
    industry: 'Healthcare Ops',
    icon: '🏨',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-600',
    status: 'beta',
    sqMax: 10,
  },
  {
    id: 'obs',
    name: 'OBS',
    shortName: 'OBS',
    description: 'Verified book retail & educational content marketplace',
    industry: 'Education',
    icon: '📚',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-600',
    status: 'beta',
    sqMax: 10,
  },
  {
    id: 'edr',
    name: 'EDR',
    shortName: 'EDR',
    description: 'Internal oversight, review escalation & SQ override engine',
    industry: 'Governance',
    icon: '🔍',
    color: '#64748B',
    gradient: 'from-slate-500 to-gray-600',
    status: 'live',
    sqMax: 10,
  },
  // ── Coming Soon ──
  {
    id: 'efs',
    name: 'EFS',
    shortName: 'EFS',
    description: 'Verified financial services & investment platform',
    industry: 'Finance',
    icon: '💳',
    color: '#06B6D4',
    gradient: 'from-cyan-600 to-sky-700',
    status: 'coming-soon',
    sqMax: 10,
  },
  {
    id: 'ere',
    name: 'ERE',
    shortName: 'ERE',
    description: 'Certified real estate listings with compliance scoring',
    industry: 'Real Estate',
    icon: '🏠',
    color: '#84CC16',
    gradient: 'from-lime-500 to-green-600',
    status: 'coming-soon',
    sqMax: 10,
  },
  {
    id: 'ets',
    name: 'ETS',
    shortName: 'ETS',
    description: 'Verified travel & hospitality services platform',
    industry: 'Travel',
    icon: '✈️',
    color: '#F97316',
    gradient: 'from-orange-500 to-amber-600',
    status: 'coming-soon',
    sqMax: 10,
  },
  {
    id: 'ems',
    name: 'EMS',
    shortName: 'EMS',
    description: 'Media & entertainment services with content trust scores',
    industry: 'Media',
    icon: '🎬',
    color: '#A855F7',
    gradient: 'from-purple-500 to-fuchsia-600',
    status: 'coming-soon',
    sqMax: 10,
  },
];

export const LIVE_PLATFORMS = PLATFORMS.filter((p) => p.status === 'live');
export const BETA_PLATFORMS = PLATFORMS.filter((p) => p.status === 'beta');
export const COMING_SOON_PLATFORMS = PLATFORMS.filter((p) => p.status === 'coming-soon');

export interface Industry {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const INDUSTRIES: Industry[] = [
  { name: 'E-Commerce', icon: '🛒', color: '#10B981', description: 'Verified sellers & products' },
  { name: 'Healthcare', icon: '🏥', color: '#EF4444', description: 'Certified medical professionals' },
  { name: 'Legal', icon: '⚖️', color: '#F59E0B', description: 'Verified legal expertise' },
  { name: 'Employment', icon: '💼', color: '#3B82F6', description: 'Trusted workforce solutions' },
  { name: 'Education', icon: '🎓', color: '#EC4899', description: 'Accredited learning content' },
  { name: 'Finance', icon: '💳', color: '#06B6D4', description: 'Regulated financial services' },
  { name: 'Real Estate', icon: '🏠', color: '#84CC16', description: 'Compliant property listings' },
  { name: 'Hospitality', icon: '🏨', color: '#8B5CF6', description: 'Rated hospitality services' },
  { name: 'Logistics', icon: '🚚', color: '#F97316', description: 'Verified delivery networks' },
  { name: 'Technology', icon: '💻', color: '#00D4FF', description: 'Certified tech solutions' },
  { name: 'Media', icon: '🎬', color: '#A855F7', description: 'Trusted media content' },
  { name: 'Governance', icon: '🔍', color: '#64748B', description: 'Oversight & compliance' },
];

export const SQ_LEVELS = [
  {
    level: 1,
    label: 'SQ1',
    title: 'Basic Identity Verified',
    description: 'Core identity confirmed. Entity is registered and traceable.',
    color: '#94A3B8',
  },
  {
    level: 2,
    label: 'SQ2',
    title: 'Platform Compliance',
    description: 'Identity verified + basic platform-specific requirements met.',
    color: '#64748B',
  },
  {
    level: 3,
    label: 'SQ3',
    title: 'Financial Validation',
    description: 'Identity + financial credentials validated and in good standing.',
    color: '#3B82F6',
  },
  {
    level: 5,
    label: 'SQ5',
    title: 'Professional Credentials',
    description: 'Industry-specific professional certifications verified.',
    color: '#06B6D4',
  },
  {
    level: 7,
    label: 'SQ7',
    title: 'Experienced & Clean Record',
    description: 'Proven track record with clean performance history.',
    color: '#8B5CF6',
  },
  {
    level: 10,
    label: 'SQ10',
    title: 'Elite Certified',
    description: 'Top-tier entity. Maximum trust. Elite platform status.',
    color: '#00D4FF',
  },
];
