'use client';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, RefreshCw, Truck } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getLatestAlbaranes } from '@/app/actions';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { useSyncManager } from '@/lib/sync';



export default function OperatorDashboard() {
    const pendingTickets = useLiveQuery(() => db.tickets.where('synced').equals(0).count());
    const [isOnline, setIsOnline] = useState(true);
    const [recentAlbaranes, setRecentAlbaranes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));

        // Cargar albaranes recientes
        getLatestAlbaranes()
            .then(data => {
                setRecentAlbaranes(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });

        return () => {
            window.removeEventListener('online', () => setIsOnline(true));
            window.removeEventListener('offline', () => setIsOnline(false));
        };
    }, []);


    const { syncTickets } = useSyncManager();
    const [isSyncingManual, setIsSyncingManual] = useState(false);

    const handleManualSync = async () => {
        if (!navigator.onLine) return alert("Estás offline.");
        setIsSyncingManual(true);
        try {
            // @ts-ignore
            await syncTickets();
            // Reload list after sync
            window.location.reload();
        } catch (e) {
            alert("Error al sincronizar: " + e);
        } finally {
            setIsSyncingManual(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            <InstallPrompt />

            {/* Hidden prefetch links to ensure offline assets are downloaded while online */}
            <div className="hidden" aria-hidden="true">
                <Link href="/ticket/new" prefetch={true}>New Ticket</Link>
                {/* Prefetch a dummy view to cache the layout/page chunks for the view route */}
                <Link href="/ticket/view?id=prefetch" prefetch={true}>View Ticket</Link>
            </div>

            <header className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    Gruas Municipal
                </h1>
                <div className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </header>

            <Card className="bg-slate-900 text-white border-none">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                    <Link href="/ticket/new" className="w-full block">
                        {/* Wrapper to isolate Button from Link styles */}
                        <div className="w-full">
                            <Button size="lg" className="w-full h-16 text-lg font-bold bg-blue-600 hover:bg-blue-500">
                                <PlusCircle className="mr-2 h-6 w-6" />
                                Nuevo Albarán
                            </Button>
                        </div>
                    </Link>
                    <p className="text-slate-400 text-sm">
                        Crear servicio de retirada en vía pública
                    </p>
                </CardContent>
            </Card>

            <Link href="/fichaje" className="block w-full">
                <Button size="lg" variant="outline" className="w-full h-14 text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 font-bold flex gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    Fichar Jornada (Entrada/Salida)
                </Button>
            </Link>

            {/* Compact Sync Status */}
            <div
                onClick={handleManualSync}
                className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-100 shadow-sm text-sm active:scale-95 transition-transform cursor-pointer hover:bg-slate-50"
            >
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-medium">Pendientes:</span>
                    <span className={`font-bold ${pendingTickets ? 'text-blue-600' : 'text-slate-400'}`}>
                        {pendingTickets ?? 0}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isSyncingManual ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                        <div className={`h-2 w-2 rounded-full ${pendingTickets ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                    )}
                    <span className="text-slate-400 text-xs">
                        {isSyncingManual ? 'Sincronizando...' : (pendingTickets ? 'Sincronizar ahora' : 'Al día (Tocar para forzar)')}
                    </span>
                </div>
            </div>

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Recientes</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : recentAlbaranes.length > 0 ? (
                    <div className="space-y-3">
                        {recentAlbaranes.map((albaran) => (
                            <Link href={`/ticket/view?id=${albaran.tempId || albaran.id}`} key={albaran.id}>
                                <Card className="hover:bg-slate-50 transition-colors mb-3">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm">#{albaran.numeroAlbaran || 'BORRADOR'}</span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(albaran.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium mb-1">
                                            {albaran.servicio?.nombre || 'Servicio desconocido'}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {albaran.municipio?.nombre || 'Sin municipio'}
                                        </div>
                                        {albaran.vehiculos && albaran.vehiculos.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                                                <div className="font-mono bg-slate-100 px-1 rounded font-bold">{albaran.vehiculos[0].matricula}</div>
                                                <div className="truncate">{albaran.vehiculos[0].marca} {albaran.vehiculos[0].modelo}</div>
                                                {albaran.vehiculos.length > 1 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded-full">+{albaran.vehiculos.length - 1}</span>}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                        No hay servicios recientes
                    </div>
                )
                }
            </section >


        </div >
    );
}

