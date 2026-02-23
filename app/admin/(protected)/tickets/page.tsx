import { prisma } from '@/lib/prisma';
import { TicketsClient } from './TicketsClient';
import { getAlbaranesAdmin } from './actions';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
    // 1. Fetch Albaranes
    const albaranes = await getAlbaranesAdmin();

    // 2. Fetch Municipalities (for filters)
    const municipalities = await prisma.municipio.findMany({
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true }
    });

    // 3. Fetch Users (for filters)
    const users = await prisma.user.findMany({
        orderBy: { username: 'asc' },
        select: { id: true, username: true, name: true }
    });

    return (
        <TicketsClient
            initialData={albaranes}
            municipalities={municipalities}
            users={users}
        />
    );
}
