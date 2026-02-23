import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MOCK_MUNICIPIOS = [
    { id: 'v1', nombre: 'Alaquàs', cif: 'P-0000001-A' },
    { id: 'v2', nombre: 'Aldaia', cif: 'P-0000002-A' },
    { id: 'v3', nombre: 'Alfafar', cif: 'P-0000003-A' },
    { id: 'v4', nombre: 'Alboraya', cif: 'P-0000004-A' },
    { id: 'v5', nombre: 'Burjassot', cif: 'P-0000005-A' },
    { id: 'v6', nombre: 'Benisanó', cif: 'P-0000006-A' },
    { id: 'v7', nombre: 'Catarroja', cif: 'P-0000007-A' },
    { id: 'v8', nombre: 'Cheste', cif: 'P-0000008-A' },
    { id: 'v9', nombre: 'Llíria', cif: 'P-0000009-A' },
    { id: 'v10', nombre: 'Loriguilla', cif: 'P-0000010-A' },
    { id: 'v11', nombre: 'Manises', cif: 'P-0000011-A' },
    { id: 'v12', nombre: 'Mislata', cif: 'P-0000012-A' },
    { id: 'v13', nombre: 'Massanassa', cif: 'P-0000013-A' },
    { id: 'v14', nombre: 'Olocau', cif: 'P-0000014-A' },
    { id: 'v15', nombre: 'Paterna', cif: 'P-0000015-A' },
    { id: 'v16', nombre: 'Picanya', cif: 'P-0000016-A' },
    { id: 'v17', nombre: 'Picassent', cif: 'P-0000017-A' },
    { id: 'v18', nombre: 'Pedralba', cif: 'P-0000018-A' },
    { id: 'v19', nombre: 'Quart de Poblet', cif: 'P-0000019-A' },
    { id: 'v20', nombre: 'Riba-roja de Túria', cif: 'P-0000020-A' },
    { id: 'v21', nombre: 'Siete Aguas', cif: 'P-0000021-A' },
    { id: 'v22', nombre: 'Torrent', cif: 'P-0000022-A' },
    { id: 'v23', nombre: 'València', cif: 'P-0000023-A' },
    { id: 'v24', nombre: 'Monserrat', cif: 'P-0000024-A' },
];

const MOCK_SERVICIOS = [
    { id: 's1', nombre: 'Arrastre (Grúa)', descripcion: 'Retirada estándar' },
    { id: 's2', nombre: 'Enganche', descripcion: 'Vehículo no retirado' },
    { id: 's3', nombre: 'Inicio Servicio', descripcion: 'Solo desplazamiento' },
];

const MOCK_INFRACCIONES = [
    { id: 'i1', codigo: '001', descripcion: 'Estacionamiento prohibido (Vado)' },
    { id: 'i2', codigo: '002', descripcion: 'Doble fila sin conductor' },
    { id: 'i3', codigo: '003', descripcion: 'Zona Carga/Descarga' },
];

const MOCK_MARCAS = [
    { id: 'ma1', nombre: 'Toyota' },
    { id: 'ma2', nombre: 'Seat' },
    { id: 'ma3', nombre: 'Ford' },
    { id: 'ma4', nombre: 'Renault' },
];

const MOCK_MODELOS = [
    { id: 'mo1', marcaId: 'ma1', nombre: 'Corolla' },
    { id: 'mo2', marcaId: 'ma1', nombre: 'Yaris' },
    { id: 'mo3', marcaId: 'ma2', nombre: 'Ibiza' },
    { id: 'mo4', marcaId: 'ma2', nombre: 'Leon' },
    { id: 'mo5', marcaId: 'ma3', nombre: 'Focus' },
    { id: 'mo6', marcaId: 'ma4', nombre: 'Megane' },
];

export async function GET() {
    try {
        await prisma.$connect();

        // 1. Municipios
        for (const m of MOCK_MUNICIPIOS) {
            await prisma.municipio.upsert({
                where: { id: m.id },
                update: {},
                create: m
            });
        }

        // 2. Servicios
        for (const s of MOCK_SERVICIOS) {
            await prisma.servicio.upsert({
                where: { id: s.id },
                update: {},
                create: s
            });
        }

        // 3. Infracciones
        for (const i of MOCK_INFRACCIONES) {
            await prisma.infraccion.upsert({
                where: { id: i.id },
                update: {},
                create: i
            });
        }

        // 4. Marcas
        for (const ma of MOCK_MARCAS) {
            await prisma.marca.upsert({
                where: { id: ma.id }, // Assuming ID is the unique identifier we want to keep
                update: {}, // Don't verify name uniqueness here, rely on ID
                create: ma
            });
        }

        // 5. Modelos
        for (const mo of MOCK_MODELOS) {
            await prisma.modelo.upsert({
                where: { id: mo.id },
                update: {},
                create: mo
            });
        }

        return NextResponse.json({ success: true, message: 'Database seeded successfully' });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
