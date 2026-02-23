'use client';

import { db } from '@/lib/db';

export function DebugResetButton() {
    const handleReset = async () => {
        if (confirm("¿Resetear App? BORRARÁ TODOS LOS DATOS LOCALES (Tickets, Cache, etc).")) {
            // 1. Unregister SW
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.getRegistrations().then(rs => {
                    for (const r of rs) r.unregister();
                });
            }
            // 2. Clear LocalStorage
            localStorage.clear();

            // 3. Delete IndexedDB
            try {
                await db.delete();
                alert("Base de datos local borrada. La aplicación se recargará.");
            } catch (e) {
                alert("Error borrando DB: " + e);
            }

            window.location.reload();
        }
    };

    return (
        <button
            onClick={handleReset}
            className="underline text-red-400 font-bold hover:text-red-500"
        >
            RESET
        </button>
    );
}
