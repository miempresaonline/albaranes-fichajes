'use client';

import { useSyncManager } from '@/lib/sync';

export function SyncProvider() {
    // This hook sets up the 'online' event listener to trigger sync automatically.
    useSyncManager();

    return null; // This component has no UI, it just runs logic.
}
