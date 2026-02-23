import Dexie, { type Table } from 'dexie';

import type { LocalTicket, LocalVehicle, OfflineMasterData } from './types';

// Re-export for convenience if needed, or just usage below works.
export type { LocalTicket, LocalVehicle, OfflineMasterData };

export class GruasDatabase extends Dexie {
    tickets!: Table<LocalTicket>;
    vehicles!: Table<LocalVehicle>;
    masterData!: Table<OfflineMasterData>;

    constructor() {
        super('GruasDB');
        this.version(1).stores({
            tickets: 'id, synced, createdAt',
            vehicles: 'id, localTicketId',
            masterData: 'id'
        });
    }
}

export const db = new GruasDatabase();
