import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET() {
    noStore();
    try {
        const [municipios, servicios, infracciones, marcas, modelos] = await Promise.all([
            prisma.municipio.findMany({ where: { isActive: true }, orderBy: { nombre: 'asc' } }),
            prisma.servicio.findMany({ where: { isActive: true }, orderBy: { nombre: 'asc' } }),
            prisma.infraccion.findMany({ where: { isActive: true }, orderBy: { codigo: 'asc' } }),
            prisma.marca.findMany({ orderBy: { nombre: 'asc' } }),
            prisma.modelo.findMany({ orderBy: { nombre: 'asc' } })
        ]);

        return NextResponse.json({
            municipios,
            servicios,
            infracciones,
            marcas,
            modelos
        });
    } catch (error) {
        console.error("Error fetching master data:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
