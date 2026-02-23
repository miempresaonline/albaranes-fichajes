import { prisma } from '@/lib/prisma';
import { TicketDetailClient } from './TicketDetailClient';
import { notFound } from 'next/navigation';
import { calculateVehiclePrice } from '@/lib/pricing';

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const ticket = await prisma.albaran.findUnique({
        where: { id },
        include: {
            municipio: true,
            servicio: true,
            infraccion: true,
            user: true,
            vehiculos: {
                include: {
                    fotos: true
                }
            }
        }
    });

    if (!ticket) {
        return notFound();
    }

    // Fetch Master Data for Dropdowns
    const [municipios, servicios, infracciones, marcas, modelos] = await Promise.all([
        prisma.municipio.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.servicio.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.infraccion.findMany({ orderBy: { codigo: 'asc' } }),
        prisma.marca.findMany({ orderBy: { nombre: 'asc' } }),
        prisma.modelo.findMany({ orderBy: { nombre: 'asc' } }),
    ]);

    // Serialize dates for Client Component
    const serializedTicket = {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        fechaInicio: ticket.fechaInicio.toISOString(),
        fechaFin: ticket.fechaFin?.toISOString() || null,
        vehiculos: ticket.vehiculos.map(v => ({
            ...v,
            fotos: v.fotos // No date fields on Foto to serialize
        }))
    };

    // Calculate Prices
    const vehiclePrices = await Promise.all(ticket.vehiculos.map(async v => {
        const price = await calculateVehiclePrice(prisma, v, ticket);
        return { id: v.id, price };
    }));
    const total = vehiclePrices.reduce((acc, curr) => acc + curr.price, 0);

    return (
        <TicketDetailClient
            ticket={serializedTicket}
            masterData={{ municipios, servicios, infracciones, marcas, modelos }}
            initialTotals={{ total, vehiclePrices }}
        />
    );
}
