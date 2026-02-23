'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch all municipalities with their derived tariffs
export async function getMunicipalities() {
    try {
        const municipios = await prisma.municipio.findMany({
            orderBy: { nombre: 'asc' },
            include: {
                tarifas: true
            }
        });
        return municipios;
    } catch (error) {
        console.error("Error fetching municipalities:", error);
        return [];
    }
}

// Fetch all services for the dialog
export async function getAllServices() {
    try {
        return await prisma.servicio.findMany({
            where: { isActive: true },
            orderBy: { nombre: 'asc' }
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        return [];
    }
}

export async function createMunicipality(data: {
    id: string;
    nombre: string;
    provincia?: string;
    isActive: boolean;
    horarioDiurnoInicio?: string;
    horarioDiurnoFin?: string;
    tarifas: {
        servicioId: string;
        precioDia: number;
        precioNoche: number;
        precioFestivo: number;
        precioMoto: number;
        precioMotoFestivo: number;
        precioPeso: number;
        precioPesoFestivo: number;
    }[];
}) {
    try {
        const existing = await prisma.municipio.findUnique({ where: { id: data.id } });
        if (existing) return { success: false, error: "El ID ya existe" };

        await prisma.$transaction(async (tx) => {
            // 1. Create Municipality
            await tx.municipio.create({
                data: {
                    id: data.id,
                    nombre: data.nombre,
                    provincia: data.provincia,
                    isActive: data.isActive,
                    horarioDiurnoInicio: data.horarioDiurnoInicio || '08:00',
                    horarioDiurnoFin: data.horarioDiurnoFin || '20:00'
                }
            });

            // 2. Create Tariffs
            if (data.tarifas && data.tarifas.length > 0) {
                await tx.tarifa.createMany({
                    data: data.tarifas.map(t => ({
                        municipioId: data.id,
                        servicioId: t.servicioId,
                        precioDia: t.precioDia,
                        precioNoche: t.precioNoche,
                        precioFestivo: t.precioFestivo,
                        precioMoto: t.precioMoto,
                        precioMotoFestivo: t.precioMotoFestivo,
                        precioPeso: t.precioPeso,
                        precioPesoFestivo: t.precioPesoFestivo
                    }))
                });
            }
        });

        revalidatePath('/admin/municipalities');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: String(error) };
    }
}

export async function updateMunicipality(id: string, data: {
    nombre: string;
    provincia?: string;
    isActive: boolean;
    horarioDiurnoInicio?: string;
    horarioDiurnoFin?: string;
    tarifas: {
        servicioId: string;
        precioDia: number;
        precioNoche: number;
        precioFestivo: number;
        precioMoto: number;
        precioMotoFestivo: number;
        precioPeso: number;
        precioPesoFestivo: number;
    }[];
}) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update Municipality
            await tx.municipio.update({
                where: { id },
                data: {
                    nombre: data.nombre,
                    provincia: data.provincia,
                    isActive: data.isActive,
                    horarioDiurnoInicio: data.horarioDiurnoInicio,
                    horarioDiurnoFin: data.horarioDiurnoFin
                }
            });

            // 2. Update Tariffs (Delete all and recreate is safest/easiest/cleanest for matrix)
            await tx.tarifa.deleteMany({
                where: { municipioId: id }
            });

            if (data.tarifas && data.tarifas.length > 0) {
                await tx.tarifa.createMany({
                    data: data.tarifas.map(t => ({
                        municipioId: id,
                        servicioId: t.servicioId,
                        precioDia: t.precioDia,
                        precioNoche: t.precioNoche,
                        precioFestivo: t.precioFestivo,
                        precioMoto: t.precioMoto,
                        precioMotoFestivo: t.precioMotoFestivo,
                        precioPeso: t.precioPeso,
                        precioPesoFestivo: t.precioPesoFestivo
                    }))
                });
            }
        });

        revalidatePath('/admin/municipalities');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: String(error) };
    }
}

export async function deleteMunicipality(id: string) {
    try {
        await prisma.municipio.delete({ where: { id } });
        revalidatePath('/admin/municipalities');
        return { success: true };
    } catch (error) {
        return { success: false, error: "No se puede eliminar: tiene datos relacionados." };
    }
}
