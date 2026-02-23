

import { prisma } from '@/lib/prisma';
import { MunicipalityDetailClient } from './MunicipalityDetailClient';
import { notFound } from 'next/navigation';

export default async function MunicipalityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let municipality = null;
    const allServices = await prisma.servicio.findMany({ where: { isActive: true } });

    if (id !== 'new') {
        municipality = await prisma.municipio.findUnique({
            where: { id },
            include: { tarifas: true }
        });

        if (!municipality) return notFound();
    }

    return <MunicipalityDetailClient municipality={municipality} allServices={allServices} />;
}
