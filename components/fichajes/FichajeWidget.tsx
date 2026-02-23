'use client';

import { useState, useEffect } from 'react';
import { registrarFichaje, getEstadoActual } from '@/app/fichajes/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Pause, Square, Play, LogOut, Loader2 } from 'lucide-react';

/* 
 * FichajeWidget - Updated with Stitch's Emerald Glassmorphism UI
 */
export function FichajeWidget() {
    const [estado, setEstado] = useState<'CARGANDO' | 'TRABAJANDO' | 'EN_PAUSA' | 'FUERA_DE_TURNO'>('CARGANDO');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastActionTime, setLastActionTime] = useState<string | null>(null);

    // Simulated shift duration 
    const [shiftSeconds, setShiftSeconds] = useState(0);

    useEffect(() => {
        cargarEstado();
    }, []);

    // Timer logic for shift duration display
    useEffect(() => {
        let interval: any;
        if (estado === 'TRABAJANDO' && !loading) {
            interval = setInterval(() => {
                setShiftSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [estado, loading]);

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return {
            h: h.toString().padStart(2, '0'),
            m: m.toString().padStart(2, '0'),
            s: s.toString().padStart(2, '0')
        };
    };

    const duration = formatDuration(shiftSeconds);

    async function cargarEstado() {
        setLoading(true);
        const res = await getEstadoActual();
        if (res.success) {
            setEstado(res.estado as any);
            if (res.ultimoFichaje?.timestamp) {
                const date = new Date(res.ultimoFichaje.timestamp);
                setLastActionTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

                // If they are working, calculate approximate current shift time (very basic estimation, 
                // in reality we should subtract pause durations)
                if (res.estado === 'TRABAJANDO') {
                    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
                    setShiftSeconds(diff > 0 ? diff : 0);
                }
            }
        } else {
            setErrorMsg(res.error || 'Error cargando estado');
        }
        setLoading(false);
    }

    async function handleFichaje(tipo: 'ENTRADA' | 'SALIDA' | 'PAUSA_INICIO' | 'PAUSA_FIN') {
        if (loading) return;
        setLoading(true);
        setErrorMsg('');

        // Fetch Geolocation
        let lat: number | undefined;
        let lng: number | undefined;

        try {
            if (navigator.geolocation) {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            }
        } catch (e) {
            console.warn('Geolocation blocked or failed', e);
        }

        const dispositivo = navigator.userAgent;
        const res = await registrarFichaje(tipo, lat, lng, dispositivo);

        if (res.success) {
            if (tipo === 'ENTRADA') setShiftSeconds(0);
            await cargarEstado();
        } else {
            setErrorMsg(res.error || 'Error al fichar');
            setLoading(false);
        }
    }

    if (estado === 'CARGANDO') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm font-medium animate-pulse">Sincronizando reloj...</p>
            </div>
        );
    }

    // Colors mapping based on state
    const isWorking = estado === 'TRABAJANDO';
    const isPaused = estado === 'EN_PAUSA';
    const bgGradient = "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5";

    return (
        <div className={`relative flex w-full flex-col overflow-hidden rounded-3xl ${bgGradient} shadow-xl p-6 transition-colors duration-500`}>

            {/* Background Glow Effect */}
            <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[80px] opacity-30 transition-colors duration-1000 pointer-events-none ${estado === 'TRABAJANDO' ? 'bg-emerald-500' :
                    estado === 'EN_PAUSA' ? 'bg-amber-500' : 'bg-slate-500'
                }`}></div>

            {/* Dashboard Content */}
            <div className="relative z-10 flex flex-col items-center text-center">

                {/* State Tag */}
                <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 border backdrop-blur-md ${isWorking ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                        isPaused ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' :
                            'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400'
                    }`}>
                    <span className="relative flex h-2 w-2">
                        {(isWorking || isPaused) && (
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWorking ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isWorking ? 'bg-emerald-500' :
                                isPaused ? 'bg-amber-500' : 'bg-slate-500'
                            }`}></span>
                    </span>
                    <span className="text-sm font-bold tracking-wide">
                        {isWorking ? 'EN TURNO' : isPaused ? 'EN PAUSA' : 'FUERA DE TURNO'}
                    </span>
                </div>

                {/* Main Clock Display */}
                <div className="mb-8">
                    {estado === 'FUERA_DE_TURNO' ? (
                        <div className="flex flex-col items-center">
                            <Clock className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-1">
                                No activo
                            </h2>
                        </div>
                    ) : (
                        <>
                            <h2 className={`font-extrabold text-slate-900 dark:text-white mb-2 transition-all ${isPaused ? 'text-4xl opacity-50' : 'text-6xl'}`}>
                                {duration.h}:{duration.m}<span className="text-emerald-500/60 text-2xl font-medium">:{duration.s}</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-normal">
                                {isPaused ? 'Tiempo pausado' : 'Duración del turno actual'}
                            </p>
                        </>
                    )}
                </div>

                {/* Sub info grid */}
                {(isWorking || isPaused) && lastActionTime && (
                    <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-6 pb-2">
                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Marcaje</p>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">{lastActionTime}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Ubicación</p>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-end gap-1">
                                <MapPin className="w-3 h-3 text-emerald-500" /> Registrada
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-4 relative z-10 w-full">

                {estado === 'FUERA_DE_TURNO' && (
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleFichaje('ENTRADA')}
                        disabled={loading}
                        className="group flex w-full items-center justify-between rounded-2xl bg-emerald-500 hover:bg-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play fill="currentColor" className="w-6 h-6" />}
                            </div>
                            <span className="text-lg font-bold tracking-tight">ENTRAR AL TURNO</span>
                        </div>
                    </motion.button>
                )}

                {estado === 'TRABAJANDO' && (
                    <AnimatePresence>
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleFichaje('PAUSA_INICIO')}
                            disabled={loading}
                            className="group flex w-full items-center justify-between rounded-2xl bg-amber-400 hover:bg-amber-500 p-5 text-amber-950 shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-950/10">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-900" /> : <Pause fill="currentColor" className="w-6 h-6 text-amber-900" />}
                                </div>
                                <span className="text-lg font-bold tracking-tight">INICIAR PAUSA</span>
                            </div>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleFichaje('SALIDA')}
                            disabled={loading}
                            className="group flex w-full items-center justify-between rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-white/10 p-5 text-slate-100 shadow-lg transition-all disabled:opacity-50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-500">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Square fill="currentColor" className="w-5 h-5" />}
                                </div>
                                <span className="text-lg font-bold tracking-tight">SALIR DEL TURNO</span>
                            </div>
                        </motion.button>
                    </AnimatePresence>
                )}

                {estado === 'EN_PAUSA' && (
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleFichaje('PAUSA_FIN')}
                        disabled={loading}
                        className="group flex w-full items-center justify-between rounded-2xl bg-emerald-500 hover:bg-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play fill="currentColor" className="w-6 h-6" />}
                            </div>
                            <span className="text-lg font-bold tracking-tight">REANUDAR TURNO</span>
                        </div>
                    </motion.button>
                )}
            </div>

            {errorMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 w-full p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center relative z-10">
                    {errorMsg}
                </motion.div>
            )}

            {/* Legal Hint */}
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-100 dark:border-white/5 relative z-10">
                <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                <p className="text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                    Tu ubicación se guarda en el momento exacto del clic para cumplimiento LOPDGDD art. 88. <strong>No</strong> hay rastreo continuo.
                </p>
            </div>

        </div>
    );
}
