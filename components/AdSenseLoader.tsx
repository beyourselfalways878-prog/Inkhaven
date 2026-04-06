import Script from 'next/script';

/**
 * AdSenseLoader — Server Component
 *
 * Loads Google AdSense on all pages. Keeping this as a server component
 * (no 'use client') guarantees the script tag is present in the initial
 * server-rendered HTML, which is what Googlebot reads for ads.txt validation
 * and ad eligibility.
 *
 * Publisher ID: ca-pub-7229649791586904
 */
export default function AdSenseLoader() {
    return (
        <Script
            id="adsbygoogle-init"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7229649791586904"
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}
