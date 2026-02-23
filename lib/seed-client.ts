import { db } from './db';

export async function seedMasterData() {
    // Only fetch if online
    if (!navigator.onLine) {
        console.log("Offline: Skipping master data update");
        return;
    }

    try {
        console.log('Fetching Master Data from Server...');
        const res = await fetch('/api/master-data');
        if (!res.ok) throw new Error('Failed to fetch master data');

        const data = await res.json();
        const { municipios, servicios, infracciones, marcas, modelos } = data;

        await db.masterData.bulkPut([
            { id: 'municipios', data: municipios || [], updatedAt: new Date() },
            { id: 'servicios', data: servicios || [], updatedAt: new Date() },
            { id: 'infracciones', data: infracciones || [], updatedAt: new Date() },
            { id: 'marcas', data: marcas || [], updatedAt: new Date() },
            { id: 'modelos', data: modelos || [], updatedAt: new Date() },
        ]);
        console.log('Master Data Updated');
    } catch (e) {
        console.error("Error updating master data:", e);
    }
}

