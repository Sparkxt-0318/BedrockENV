import type { Metadata } from 'next';
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://getbedrock.com'),
  title: {
    default: 'Bedrock — Environmental Exposure Intelligence',
    template: '%s | Bedrock',
  },
  description:
    'Discover what is contaminating your home, land, air, and water. Bedrock aggregates 10+ federal data sources into a single address-level environmental exposure report.',
  openGraph: {
    title: 'Bedrock — Environmental Exposure Intelligence',
    description:
      'See what is really in your water and soil. Powered by EPA, USDA, NASA, USGS, FEMA, and U.S. Census data.',
    siteName: 'Bedrock',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${instrumentSerif.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
