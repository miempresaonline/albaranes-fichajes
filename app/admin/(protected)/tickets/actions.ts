'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch all albaranes with pagination later? For now, fetch latest 100
// Fetch albaranes with filters
export async function getAlbaranesAdmin(filters?: {
    municipioId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        const whereClause: any = {};

        if (filters?.municipioId && filters.municipioId !== 'all') {
            whereClause.municipioId = filters.municipioId;
        }

        if (filters?.userId && filters.userId !== 'all') {
            whereClause.userId = filters.userId;
        }

        if (filters?.startDate || filters?.endDate) {
            whereClause.createdAt = {};
            if (filters.startDate) {
                // Start of day
                const start = new Date(filters.startDate);
                start.setHours(0, 0, 0, 0);
                whereClause.createdAt.gte = start;
            }
            if (filters.endDate) {
                // End of day
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.createdAt.lte = end;
            }
        }

        const albaranes = await prisma.albaran.findMany({
            take: 200, // Increase limit slightly
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                municipio: true,
                servicio: true,
                vehiculos: true,
                user: true,
            }
        });

        // Serialize dates
        return albaranes.map(a => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
            fechaInicio: a.fechaInicio.toISOString(),
            fechaFin: a.fechaFin?.toISOString() || null
        }));

    } catch (error) {
        console.error("Error fetching admin albaranes:", error);
        return [];
    }
}

export async function deleteAlbaranAdmin(id: string) {
    // We can reuse the main deleteAlbaran generic action if we want, or duplicate logic to be safe.
    // Let's duplicate basic transaction logic to simple delete for now, 
    // or better yet, verify if we can just call deleteOne
    try {
        // Transactional delete
        await prisma.$transaction(async (tx) => {
            const vehicles = await tx.vehiculoRetirado.findMany({ where: { albaranId: id } });
            const vIds = vehicles.map(v => v.id);

            if (vIds.length > 0) {
                await tx.foto.deleteMany({ where: { vehiculoRetiradoId: { in: vIds } } });
            }

            await tx.vehiculoRetirado.deleteMany({ where: { albaranId: id } });
            await tx.albaran.delete({ where: { id } });
        });

        revalidatePath('/admin/tickets');
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}
