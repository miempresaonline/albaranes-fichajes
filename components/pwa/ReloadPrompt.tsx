'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ReloadPrompt() {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Handle controller change (when new SW takes over due to skipWaiting: true)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setNeedRefresh(true);
            });

            // If we wanted to handle skipWaiting: false, we'd check registration.waiting here
            // using a more complex registration logic or a library like 'virtual:pwa-register'.
            // But since we set skipWaiting: true in sw.ts, controllerchange is our main signal.
        }
    }, []);

    const onOfflineReady = () => {
        setOfflineReady(true);
        setTimeout(() => setOfflineReady(false), 4000); // Hide after 4s
    };

    const handleRefresh = () => {
        setNeedRefresh(false);
        window.location.reload();
    };

    if (!needRefresh && !offlineReady) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">
                            {offlineReady ? "App lista para offline" : "Nueva versión disponible"}
                        </h4>
                        <p className="text-xs text-slate-400">
                            {offlineReady ? "Ya puedes usar la app sin conexión." : "Actualiza para ver los cambios."}
                        </p>
                    </div>
                    {needRefresh && (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-blue-600 text-white hover:bg-blue-700 border-none font-bold"
                                onClick={handleRefresh}
                            >
                                <RefreshCcw className="h-4 w-4 mr-2" /> Actualizar
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={() => setNeedRefresh(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {offlineReady && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                            onClick={() => setOfflineReady(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
