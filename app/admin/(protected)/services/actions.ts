'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getServices() {
    try {
        return await prisma.servicio.findMany({
            orderBy: { nombre: 'asc' }
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        return [];
    }
}

export async function createService(data: {
    id: string;
    nombre: string;
    descripcion?: string;
    isActive: boolean;
}) {
    try {
        const existing = await prisma.servicio.findUnique({ where: { id: data.id } });
        if (existing) return { success: false, error: "El ID ya existe" };

        await prisma.servicio.create({
            data: {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                isActive: data.isActive
            }
        });
        revalidatePath('/admin/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function updateService(id: string, data: {
    nombre: string;
    descripcion?: string;
    isActive: boolean;
}) {
    try {
        await prisma.servicio.update({
            where: { id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                isActive: data.isActive
            }
        });
        revalidatePath('/admin/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function deleteService(id: string) {
    try {
        await prisma.servicio.delete({ where: { id } });
        revalidatePath('/admin/services');
        return { success: true };
    } catch (error) {
        return { success: false, error: "No se puede eliminar: tiene albaranes asociados." };
    }
}
