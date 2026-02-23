'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getFestivos() {
    try {
        return await prisma.festivo.findMany({
            orderBy: { fecha: 'asc' },
            include: { municipio: true } // If specific to municipality
        });
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function createFestivo(data: {
    nombre: string;
    fecha: Date;
    esGlobal: boolean;
    municipioId?: string;
}) {
    try {
        await prisma.festivo.create({
            data: {
                nombre: data.nombre,
                fecha: data.fecha,
                esGlobal: data.esGlobal,
                municipioId: data.municipioId || null
            }
        });
        revalidatePath('/admin/settings/festivos');
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function deleteFestivo(id: string) {
    try {
        await prisma.festivo.delete({ where: { id } });
        revalidatePath('/admin/settings/festivos');
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}
