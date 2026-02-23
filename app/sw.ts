// Service Worker enabled
import { Serwist, type SerwistGlobalConfig, StaleWhileRevalidate } from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: Array<{
            revision: string | null;
            url: string;
        }>;
    }
}

declare const self: ServiceWorkerGlobalScope;

// Force precache of offline page AND home page (App Shell) to ensure availability
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('navigation-cache-v3').then((cache) => {
            // Cache offline page, root, and critical routes (App Shell + Subpages)
            return cache.addAll([
                '/offline.html',
                '/',
                '/ticket/new',
                // Note: /ticket/view needs logic to work without query params if visited directly, 
                // but precaching the route helps SW serve the shell.
                '/ticket/view'
            ]);
        })
    );
});

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        {
            matcher: ({ request }) => {
                return request.mode === "navigate";
            },
            handler: new StaleWhileRevalidate({
                cacheName: 'navigation-cache-v3',
                plugins: [
                    {
                        handlerDidError: async () => {
                            return await caches.match('/offline.html') || Response.error();
                        },
                    },
                ],
            }),
        },
        ...defaultCache,
    ],
    fallbacks: {
        entries: [
            {
                url: "/offline.html",
                matcher: ({ request }) => request.mode === "navigate",
            },
        ],
    },
});

serwist.addEventListeners();
