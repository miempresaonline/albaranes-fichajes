'use client';

import { useEffect } from 'react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

export function useSyncManager() {
    const pendingCount = useLiveQuery(() => db.tickets.where('synced').equals(0).count());

    useEffect(() => {
        const handleOnline = () => {
            console.log("Network Online. Attempting Sync...");
            syncTickets();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    const syncTickets = async () => {
        // Use filter to be safe against boolean 'false' vs number '0' mismatch
        const pending = await db.tickets.filter(t => !t.synced || t.synced === 0).toArray();

        if (pending.length === 0) {
            console.log("No pending tickets found to sync.");
            return 0; // Return count for caller
        }

        console.log(`Found ${pending.length} pending tickets.`);

        // Prepare payloads
        const payloads = [];
        for (const ticket of pending) {
            const vehicles = await db.vehicles.where('localTicketId').equals(ticket.id).toArray();
            payloads.push({ ...ticket, vehicles });
        }

        try {
            console.log("Syncing Tickets:", payloads.length);

            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloads)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Sync failed (${response.status}): ${text}`);
            }

            const data = await response.json();

            if (data.results) {
                let successCount = 0;
                let errorDetails = "";

                for (const res of data.results) {
                    if (res.status === 'synced' || res.status === 'already_synced') {
                        // Update to 'true' (boolean) which is truthy
                        await db.tickets.update(res.id, { synced: true });
                        successCount++;
                    } else {
                        console.error("Failed to sync ticket:", res.id, res.error);
                        errorDetails += `Ticket ${res.id}: ${res.error}\n`;
                    }
                }

                if (errorDetails) {
                    alert(`Sincronización parcial:\nExito: ${successCount}\nErrores:\n${errorDetails}`);
                } else if (successCount > 0) {
                    // Optional: notify success
                    // alert("Sincronización completada correctamente.");
                }
                return successCount;
            }
            return 0;

        } catch (e) {
            console.error("Sync Process Failed:", e);
            alert(`ERROR DE SINCRONIZACIÓN: ${(e as Error).message}`);
            throw e; // Re-throw so handleFinalize knows it failed
        }
    };

    return { pendingCount, syncTickets };
}
