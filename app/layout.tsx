import './globals.css';
import type { ReactNode } from 'react';
import { Viewport } from 'next';
import AdSenseLoader from '../components/AdSenseLoader';
import Providers from '../components/Providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import InviteToast from '../components/InviteToast';
import ModerationGate from '../components/ModerationGate';
import { ThemeProvider } from '../components/ThemeProvider';
import LiveBackgroundRenderer from '../components/Backgrounds/LiveBackgroundRenderer';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export const metadata = {
  title: 'InkHaven | Anonymous & Safe Chat',
  description: 'Connect safely and anonymously with InkHaven. Features AI moderation, interest matching, and a beautiful interface. No login required.',
  keywords: ['anonymous chat', 'safe chat', 'secure messaging', 'stranger chat', 'inkhaven', 'mental health friendly'],
  authors: [{ name: 'Twinkle Tiwari' }],
  creator: 'Twinkle Tiwari',
  publisher: 'Namami Creations',
  metadataBase: new URL('https://www.inkhaven.in'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'InkHaven - Your Anonymous Sanctuary',
    description: 'A safe space for genuine conversations. No data collection, just connection.',
    url: 'https://www.inkhaven.in',
    siteName: 'InkHaven',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InkHaven Chat',
    description: 'Anonymous, safe, and intelligent chat sanctuary.',
    creator: '@inkhaven',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
  other: {
    'google-adsense-account': 'ca-pub-7229649791586904'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <AdSenseLoader />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'InkHaven',
              url: 'https://www.inkhaven.in',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.inkhaven.in/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LiveBackgroundRenderer />
            <ModerationGate>
              {/* Icon sidebar — fixed left on desktop, fixed bottom tab bar on mobile */}
              <Sidebar />
              {/* Top header for logo/theme/controls */}
              <Header />
              {/* Global invite notifications — replaces window.confirm */}
              <InviteToast />
              {/* Content area — padded left on desktop to avoid sidebar overlap */}
              <main className="min-h-screen flex flex-col relative z-10 md:pl-[72px] pb-[72px] md:pb-0">
                {children}
              </main>
              {/* Footer only shown on desktop */}
              <div className="hidden md:block md:pl-[72px]">
                <Footer />
              </div>
            </ModerationGate>
          </ThemeProvider>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
