'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const ALLOWED_ADSENSE_PATHS = [
    '/',
    '/about',
    '/faq',
    '/legal/privacy',
    '/legal/terms'
];

export default function AdSenseLoader() {
    const pathname = usePathname();

    // Only load AdSense on content-rich pages to avoid AdSense Policy Violations
    const isAllowed = ALLOWED_ADSENSE_PATHS.includes(pathname || '') || 
                     (pathname?.startsWith('/blog'));

    if (!isAllowed) {
        return null;
    }

    return (
        <Script
            id="google-adsense"
            strategy="lazyOnload"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7229649791586904"
            crossOrigin="anonymous"
        />
    );
}
