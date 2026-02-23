'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getInfracciones() {
    try {
        return await prisma.infraccion.findMany({
            orderBy: { codigo: 'asc' }
        });
    } catch (error) {
        console.error("Error fetching infracciones:", error);
        return [];
    }
}

export async function createInfraccion(data: {
    id: string;
    codigo: string;
    descripcion: string;
    isActive: boolean;
}) {
    try {
        const existing = await prisma.infraccion.findUnique({ where: { id: data.id } });
        if (existing) return { success: false, error: "El ID ya existe" };

        await prisma.infraccion.create({
            data: {
                id: data.id,
                codigo: data.codigo,
                descripcion: data.descripcion,
                isActive: data.isActive
            }
        });
        revalidatePath('/admin/infracciones');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function updateInfraccion(id: string, data: {
    codigo: string;
    descripcion: string;
    isActive: boolean;
}) {
    try {
        await prisma.infraccion.update({
            where: { id },
            data: {
                codigo: data.codigo,
                descripcion: data.descripcion,
                isActive: data.isActive
            }
        });
        revalidatePath('/admin/infracciones');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function deleteInfraccion(id: string) {
    try {
        await prisma.infraccion.delete({ where: { id } });
        revalidatePath('/admin/infracciones');
        return { success: true };
    } catch (error) {
        return { success: false, error: "No se puede eliminar: tiene datos relacionados." };
    }
}
