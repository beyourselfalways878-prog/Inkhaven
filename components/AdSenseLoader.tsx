'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const ALLOWED_ADSENSE_PATHS = [
    '/',
    '/about',
    '/faq',
    '/legal/privacy',
    '/legal/terms'
];

export default function AdSenseLoader() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only load AdSense on content-rich pages to avoid AdSense Policy Violations
    const isAllowed = ALLOWED_ADSENSE_PATHS.includes(pathname || '') || 
                     (pathname?.startsWith('/blog'));

    if (!isAllowed || !mounted) {
        return null;
    }

    return (
        <div dangerouslySetInnerHTML={{
            __html: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7229649791586904" crossorigin="anonymous"></script>`
        }} />
    );
}
