import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

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
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Instrument+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
