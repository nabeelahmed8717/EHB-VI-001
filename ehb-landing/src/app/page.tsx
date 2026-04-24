import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import StatsBar from '@/components/StatsBar';
import WhatIsEHB from '@/components/WhatIsEHB';
import PlatformGrid from '@/components/PlatformGrid';
import PSSEngine from '@/components/PSSEngine';
import SQLevels from '@/components/SQLevels';
import Industries from '@/components/Industries';
import HowItWorks from '@/components/HowItWorks';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="relative bg-[#000008] text-white overflow-x-hidden">
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
