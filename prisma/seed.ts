import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MOCK_MUNICIPIOS: { id: string; nombre: string }[] = [
    // { id: 'v1', nombre: 'Alaquàs' },
    // ... clean setup, no mocks
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

async function main() {
    console.log("Seeding server database...");

    // Municipios
    for (const m of MOCK_MUNICIPIOS) {
        await prisma.municipio.upsert({
            where: { id: m.id },
            update: { nombre: m.nombre },
            create: { id: m.id, nombre: m.nombre },
        });
    }

    // Servicios
    for (const s of MOCK_SERVICIOS) {
        await prisma.servicio.upsert({
            where: { id: s.id },
            update: { nombre: s.nombre, descripcion: s.descripcion },
            create: { id: s.id, nombre: s.nombre, descripcion: s.descripcion },
        });
    }

    // Infracciones
    for (const i of MOCK_INFRACCIONES) {
        await prisma.infraccion.upsert({
            where: { id: i.id },
            update: { codigo: i.codigo, descripcion: i.descripcion },
            create: { id: i.id, codigo: i.codigo, descripcion: i.descripcion },
        });
    }

    // Marcas
    for (const m of MOCK_MARCAS) {
        await prisma.marca.upsert({
            where: { id: m.id },
            update: { nombre: m.nombre },
            create: { id: m.id, nombre: m.nombre },
        });
    }

    // Modelos
    for (const m of MOCK_MODELOS) {
        await prisma.modelo.upsert({
            where: { id: m.id },
            update: { nombre: m.nombre, marcaId: m.marcaId },
            create: { id: m.id, nombre: m.nombre, marcaId: m.marcaId },
        });
    }

    // Users
    // Try to require bcryptjs safely
    let bcrypt;
    try {
        bcrypt = require('bcryptjs');
    } catch (e) {
        try {
            bcrypt = require(process.cwd() + '/node_modules/bcryptjs');
        } catch (e2) {
            console.warn("Could not load bcryptjs. Using hardcoded hashes for demo.");
        }
    }

    // Hashes for 'admin' and 'gruista' (salt rounds 10)
    // admin: $2a$10$X7V.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1 (Fake)
    // Actually using a known hash for "admin" and "gruista" if lib fails
    // admin / admin
    const fallbackAdmin = '$2a$10$WkXwzN5.h1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1';
    // This hash is invalid but acts as placeholder. 
    // Ideally we rely on bcrypt. If bcrypt is missing, login might fail unless we update logic or user resets password.

    let adminPass = fallbackAdmin;
    let gruistaPass = fallbackAdmin;

    if (bcrypt) {
        adminPass = await bcrypt.hash('admin', 10);
        gruistaPass = await bcrypt.hash('gruista', 10);
    } else {
        console.error("CRITICAL: bcryptjs not found/loaded. Passwords will be broken unless updated manually.");
    }

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: { password: adminPass, role: 'SUPER_ADMIN', isActive: true },
        create: {
            username: 'admin',
            password: adminPass,
            role: 'SUPER_ADMIN',
            name: 'Administrador',
            email: 'admin@example.com',
            isActive: true
        }
    });

    await prisma.user.upsert({
        where: { username: 'gruista' },
        update: { password: gruistaPass, role: 'GRUISTA', isActive: true },
        create: {
            username: 'gruista',
            password: gruistaPass,
            role: 'GRUISTA',
            name: 'Operador Gruista',
            email: 'gruista@example.com',
            isActive: true
        }
    });

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
