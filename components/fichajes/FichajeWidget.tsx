'use client';

import { useState, useEffect } from 'react';
import { registrarFichaje, getEstadoActual } from '@/app/fichajes/actions';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';

export function FichajeWidget() {
    const [estado, setEstado] = useState<'CARGANDO' | 'TRABAJANDO' | 'EN_PAUSA' | 'FUERA_DE_TURNO'>('CARGANDO');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastActionTime, setLastActionTime] = useState<string | null>(null);

    useEffect(() => {
        cargarEstado();
    }, []);

    async function cargarEstado() {
        setLoading(true);
        const res = await getEstadoActual();
        if (res.success) {
            setEstado(res.estado as any);
            if (res.ultimoFichaje?.timestamp) {
                setLastActionTime(new Date(res.ultimoFichaje.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } else {
            setErrorMsg(res.error || 'Error cargando estado');
        }
        setLoading(false);
    }

    async function handleFichaje(tipo: 'ENTRADA' | 'SALIDA' | 'PAUSA_INICIO' | 'PAUSA_FIN') {
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
            // Let it pass without coords based on requirements, or require it.
        }

        const dispositivo = navigator.userAgent;
        const res = await registrarFichaje(tipo, lat, lng, dispositivo);

        if (res.success) {
            await cargarEstado();
        } else {
            setErrorMsg(res.error || 'Error al fichar');
        }
        setLoading(false);
    }

    if (estado === 'CARGANDO') {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando estado...</div>;
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center gap-6 relative overflow-hidden">

            {/* Status indicator */}
            <div className="flex flex-col items-center gap-1 z-10">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                    Estado Actual
                </span>
                <h2 className={`text-2xl tracking-tight font-bold ${estado === 'TRABAJANDO' ? 'text-emerald-600' :
                        estado === 'EN_PAUSA' ? 'text-amber-500' : 'text-slate-800'
                    }`}>
                    {estado === 'TRABAJANDO' && 'En Turno'}
                    {estado === 'EN_PAUSA' && 'Pausado'}
                    {estado === 'FUERA_DE_TURNO' && 'Fuera de Turno'}
                </h2>
                {lastActionTime && (
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Última marca: {lastActionTime}</span>
                    </div>
                )}
            </div>

            {/* Main Buttons */}
            <div className="w-full flex flex-col gap-3 py-4 z-10">
                {estado === 'FUERA_DE_TURNO' && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFichaje('ENTRADA')}
                        disabled={loading}
                        className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl shadow-lg shadow-emerald-200 font-bold text-xl transition-all disabled:opacity-50 flex flex-col items-center gap-1"
                    >
                        <span>ENTRAR</span>
                        <span className="text-emerald-200 text-xs font-normal">Iniciar jornada</span>
                    </motion.button>
                )}

                {estado === 'TRABAJANDO' && (
                    <>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleFichaje('PAUSA_INICIO')}
                            disabled={loading}
                            className="w-full py-4 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-800 rounded-2xl font-bold text-lg transition-all disabled:opacity-50"
                        >
                            INICIAR PAUSA
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleFichaje('SALIDA')}
                            disabled={loading}
                            className="w-full py-5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white rounded-2xl shadow-xl shadow-slate-200 font-bold text-xl transition-all disabled:opacity-50"
                        >
                            SALIR DEL TURNO
                        </motion.button>
                    </>
                )}

                {estado === 'EN_PAUSA' && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFichaje('PAUSA_FIN')}
                        disabled={loading}
                        className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl shadow-lg shadow-emerald-200 font-bold text-xl transition-all disabled:opacity-50 flex flex-col items-center gap-1"
                    >
                        <span>REANUDAR</span>
                        <span className="text-emerald-200 text-xs font-normal">Volver al turno</span>
                    </motion.button>
                )}
            </div>

            {errorMsg && (
                <div className="w-full p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center z-10">
                    {errorMsg}
                </div>
            )}

            {/* Decorative background circle */}
            <div className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000 ${estado === 'TRABAJANDO' ? 'bg-emerald-500' :
                    estado === 'EN_PAUSA' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />

            {/* Geoloc Disclaimer */}
            <div className="flex items-start gap-2 pt-2 text-slate-400 text-[10px] leading-tight z-10">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                <p>Tu ubicación solo se guarda en el momento exacto de pulsar el botón, en cumplimiento con la LOPDGDD art. 88 y sin rastreo continuo.</p>
            </div>

        </div>
    );
}
