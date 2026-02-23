'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        serwist: any;
    }
}

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.serwist !== undefined) {
            // If relying on auto-injection (unlikely with just next config), but standard practice:
        }

        // Manual registration to guarantee it works
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                })
                    .then(registration => {
                        console.log('SW Registered:', registration);
                    })
                    .catch(error => {
                        console.error('SW Registration failed:', error);
                    });
            });
        }
    }, []);

    return null;
}
