
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING CLEANUP ---');

    try {
        // 1. Count existing data
        const countAlbaranes = await prisma.albaran.count();
        const countVehiculos = await prisma.vehiculoRetirado.count();
        const countFotos = await prisma.foto.count();

        console.log(`CURRENT STATE:`);
        console.log(`- Albaranes: ${countAlbaranes}`);
        console.log(`- Vehiculos: ${countVehiculos}`);
        console.log(`- Fotos: ${countFotos}`);

        if (countAlbaranes === 0 && countVehiculos === 0) {
            console.log("Database appears empty. Nothing to delete.");
            return;
        }

        console.log('--- DELETING ---');

        // 2. Delete Photos (Grandchildren)
        const deletedFotos = await prisma.foto.deleteMany({});
        console.log(`Deleted ${deletedFotos.count} fotos.`);

        // 3. Delete Vehicles (Children)
        const deletedVehicles = await prisma.vehiculoRetirado.deleteMany({});
        console.log(`Deleted ${deletedVehicles.count} vehicles.`);

        // 4. Delete Albaranes (Parents)
        const deletedAlbaranes = await prisma.albaran.deleteMany({});
        console.log(`Deleted ${deletedAlbaranes.count} albaranes.`);

        console.log('--- CLEANUP COMPLETE ---');
    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
