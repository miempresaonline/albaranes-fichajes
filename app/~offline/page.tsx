'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";

export default function OfflineFallback() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-50 space-y-6">
            <div className="bg-slate-200 p-6 rounded-full">
                <WifiOff className="h-12 w-12 text-slate-500" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">Sin Conexión</h1>
                <p className="text-slate-500 max-w-xs mx-auto">
                    No tienes acceso a internet y esta página no está guardada en tu dispositivo.
                </p>
            </div>
            <Button
                onClick={() => window.location.href = '/'}
                className="w-full max-w-xs font-bold"
            >
                <RefreshCw className="mr-2 h-4 w-4" /> Recargar Inicio
            </Button>
        </div>
    );
}
