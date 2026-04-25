import type { Metadata } from 'next';
import { Noto_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EHB — The Trust Infrastructure for Everything',
  description:
    'EHB (Education Health Business) is a centralized multi-industry trust platform that governs 30+ service platforms through one unified verification engine — PSS.',
  keywords: [
    'EHB',
    'Education Health Business',
    'PSS',
    'trust platform',
    'SQ Level',
    'verification',
    'GoSellr',
    'OLS',
    'HPS',
  ],
  authors: [{ name: 'EHB' }],
  openGraph: {
    title: 'EHB — The Trust Infrastructure for Everything',
    description:
      'One unified trust engine. 30+ platforms. Every industry.',
    url: 'https://ehb.com',
    siteName: 'EHB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EHB — The Trust Infrastructure for Everything',
    description: 'One unified trust engine. 30+ platforms. Every industry.',
  },
  metadataBase: new URL('https://ehb.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSans.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
