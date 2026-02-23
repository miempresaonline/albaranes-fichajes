
import { PrismaClient } from '@prisma/client';

/**
 * Calculates the price for a specific vehicle in a ticket based on:
 * - Municipality Tariffs (Day/Night, Festivo, Moto, Peso)
 * - Schedule (Day/Night hours)
 * - Holidays (General or Local)
 */
export async function calculateVehiclePrice(
    prisma: PrismaClient,
    vehicle: { esMoto: boolean; esSobrepeso: boolean },
    ticket: { fechaInicio: Date; municipioId: string; servicioId: string }
): Promise<number> {

    // 1. Get Municipality & Tariffs & Holidays
    const municipio = await prisma.municipio.findUnique({
        where: { id: ticket.municipioId },
        include: {
            tarifas: { where: { servicioId: ticket.servicioId } },
            festivos: true
        }
    });

    if (!municipio || municipio.tarifas.length === 0) return 0;
    const tarifa = municipio.tarifas[0];
    const festivosLocales = municipio.festivos;

    // 2. Check Global Holidays
    const globalFestivos = await prisma.festivo.findMany({ where: { esGlobal: true } });
    const allFestivos = [...festivosLocales, ...globalFestivos];

    const ticketDate = new Date(ticket.fechaInicio);

    // Check if Today is Festivo
    const isHoliday = allFestivos.some(f =>
        f.fecha.getDate() === ticketDate.getDate() &&
        f.fecha.getMonth() === ticketDate.getMonth() &&
        f.fecha.getFullYear() === ticketDate.getFullYear()
    );

    // Check if Sunday (0 = Sunday)
    const isSunday = ticketDate.getDay() === 0;

    // Check Day/Night
    // Parse schedule "HH:mm"
    const [startH, startM] = (municipio.horarioDiurnoInicio || "08:00").split(':').map(Number);
    const [endH, endM] = (municipio.horarioDiurnoFin || "20:00").split(':').map(Number);

    const ticketH = ticketDate.getHours();
    const ticketM = ticketDate.getMinutes();

    const ticketMinutes = ticketH * 60 + ticketM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const isNight = ticketMinutes < startMinutes || ticketMinutes >= endMinutes;

    // Pricing Logic
    // If it's a special vehicle (Moto/Peso), does it OVERRIDE everything or ADD?
    // Based on user request: "una columna de peso... otra de Moto... otra de Festivo"
    // Usually priorities:
    // 1. Peso (Highest priority usually)
    // 2. Moto
    // 3. Car (Standard) -> Check Holiday/Night/Day

    // However, user said "Calculated based on prices marked in Ayuntamientos".
    // If we have specific columns, let's use them.

    // Priority Logic based on user request "Moto fest/noct" column.

    // 1. Overweight (Peso) - Highest priority
    if (vehicle.esSobrepeso) {
        if ((isNight || isHoliday || isSunday) && Number(tarifa.precioPesoFestivo) > 0) {
            return Number(tarifa.precioPesoFestivo);
        }
        if (Number(tarifa.precioPeso) > 0) {
            return Number(tarifa.precioPeso);
        }
    }

    // 2. Moto Special Conditions (Night OR Holiday)
    if (vehicle.esMoto && (isNight || isHoliday || isSunday)) {
        // If specific Moto Festivo price exists, use it.
        // If not, fallback to standard Moto price? Or standard Festivo?
        // Assumed: Moto Festivo column overrides standard Moto price.
        if (Number(tarifa.precioMotoFestivo) > 0) return Number(tarifa.precioMotoFestivo);
    }

    // 3. Moto Standard
    if (vehicle.esMoto && Number(tarifa.precioMoto) > 0) {
        return Number(tarifa.precioMoto);
    }

    // 4. Standard Car Conditions
    if (isHoliday || isSunday) {
        if (Number(tarifa.precioFestivo) > 0) return Number(tarifa.precioFestivo);
    }

    if (isNight) {
        if (Number(tarifa.precioNoche) > 0) return Number(tarifa.precioNoche);
    }

    // 5. Default Day
    return Number(tarifa.precioDia);
}
