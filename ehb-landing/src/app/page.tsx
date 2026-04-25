import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import StatsBar from '@/components/StatsBar';
import WhatIsEHB from '@/components/WhatIsEHB';
import PlatformGrid from '@/components/PlatformGrid';
import PSSEngine from '@/components/PSSEngine';
import HowItWorks from '@/components/HowItWorks';
import SQLevels from '@/components/SQLevels';
import Industries from '@/components/Industries';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="relative bg-[#F7F9FF] text-[#0F172A] overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <WhatIsEHB />
      <PlatformGrid />
      <PSSEngine />
      <HowItWorks />
      <SQLevels />
      <Industries />
      <CTASection />
      <Footer />
    </main>
  );
}
