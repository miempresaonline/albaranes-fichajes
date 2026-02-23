'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateTicket(id: string, data: any) {
    try {
        await prisma.albaran.update({
            where: { id },
            data: {
                municipioId: data.municipioId,
                servicioId: data.servicioId,
                infraccionId: data.infraccionId || null,
                calle: data.calle,
                ciudad: data.ciudad,
                fechaInicio: new Date(data.fechaInicio),
                fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
                policiaPlaca: data.policiaPlaca,
                policiaFirma: data.policiaFirma,
            }
        });
        revalidatePath(`/admin/tickets/${id}`);
        revalidatePath(`/admin/tickets`);
        return { success: true };
    } catch (error) {
        console.error("Error updating ticket:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteVehicle(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // Delete photos first
            await tx.foto.deleteMany({ where: { vehiculoRetiradoId: id } });
            await tx.vehiculoRetirado.delete({ where: { id } });
        });

        revalidatePath(`/admin/tickets`); // In case it affects list count
        return { success: true };
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        return { success: false, error: String(error) };
    }
}

// ... existing imports
import { calculateVehiclePrice } from '@/lib/pricing';

// ... existing code

export async function addVehicle(ticketId: string, data: {
    matricula: string;
    marca: string;
    modelo: string;
    esMoto: boolean;
    esSobrepeso: boolean;
    fotos: string[]; // Base64
}) {
    try {
        await prisma.vehiculoRetirado.create({
            data: {
                albaranId: ticketId,
                matricula: data.matricula,
                marca: data.marca,
                modelo: data.modelo,
                esMoto: data.esMoto,
                esSobrepeso: data.esSobrepeso,
                fotos: {
                    create: data.fotos.map(url => ({
                        url // potentially upload to S3/Blob here in real app, simply storing base64/url for now
                    }))
                }
            }
        });
        revalidatePath(`/admin/tickets/${ticketId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding vehicle:", error);
        return { success: false, error: String(error) };
    }
}

export async function getTicketTotals(ticketId: string) {
    try {
        const ticket = await prisma.albaran.findUnique({
            where: { id: ticketId },
            include: { vehiculos: true }
        });

        if (!ticket) return { success: false, error: "Ticket not found" };

        let total = 0;
        const vehiclePrices = [];

        for (const v of ticket.vehiculos) {
            const price = await calculateVehiclePrice(prisma, v, ticket);
            vehiclePrices.push({ id: v.id, price });
            total += price;
        }

        return { success: true, total, vehiclePrices };
    } catch (error) {
        console.error("Error calculating totals:", error);
        return { success: false, error: String(error) };
    }
}
