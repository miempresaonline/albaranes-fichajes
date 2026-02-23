'use server';

import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';

export async function getLatestAlbaranes() {
  noStore();
  revalidatePath('/');
  console.log("Fetching latest albaranes (uncached)...");
  try {
    const albaranes = await prisma.albaran.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        municipio: true,
        servicio: true,
        vehiculos: true, // Show basic vehicle info
      },
    });

    // Serializar fechas y decimales para pasar al cliente
    return albaranes.map((albaran) => ({
      ...albaran,
      createdAt: albaran.createdAt.toISOString(),
      updatedAt: albaran.updatedAt.toISOString(),
      fechaInicio: albaran.fechaInicio.toISOString(),
      fechaFin: albaran.fechaFin?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Error fetching latest albaranes:', error);
    return [];
  }
}

export async function deleteAlbaran(idOrTempId: string) {
  try {
    // 1. Resolve the correct ID (Primary Key)
    // We try to find a record where id matches OR tempId matches.
    const record = await prisma.albaran.findFirst({
      where: {
        OR: [
          { id: idOrTempId },
          { tempId: idOrTempId }
        ]
      },
      select: { id: true }
    });

    if (!record) {
      return { success: false, error: "Albarán no encontrado en el servidor" };
    }

    const id = record.id; // Real Server ID

    // 2. Transactional Delete
    await prisma.$transaction(async (tx) => {
      // Find vehicles
      const vehicles = await tx.vehiculoRetirado.findMany({ where: { albaranId: id } });
      const vehicleIds = vehicles.map(v => v.id);

      // Delete Photos
      if (vehicleIds.length > 0) {
        await tx.foto.deleteMany({
          where: { vehiculoRetiradoId: { in: vehicleIds } }
        });
      }

      // Delete Vehicles
      await tx.vehiculoRetirado.deleteMany({
        where: { albaranId: id }
      });

      // Delete Albaran
      await tx.albaran.delete({
        where: { id }
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error("Delete error:", e);
    return { success: false, error: String(e) };
  }
}

export async function getDebugInfo() {
  noStore();
  try {
    const count = await prisma.albaran.count();
    const url = process.env.DATABASE_URL || 'No URL found';
    const maskedUrl = url.replace(/:[^:@]*@/, ':****@'); // Mask password
    return { count, dbUrl: maskedUrl };
  } catch (e) {
    return { count: -1, dbUrl: 'Error: ' + String(e) };
  }
}

export async function getAlbaranById(id: string) {
  noStore();
  try {
    const albaran = await prisma.albaran.findUnique({
      where: { id },
      include: {
        municipio: true,
        servicio: true,
        infraccion: true,
        vehiculos: { include: { fotos: true } }
      }
    });

    if (!albaran) {
      const byTemp = await prisma.albaran.findFirst({
        where: { tempId: id },
        include: {
          municipio: true,
          servicio: true,
          infraccion: true,
          vehiculos: { include: { fotos: true } }
        }
      });
      if (!byTemp) return null;
      return transformAlbaranToLocalLike(byTemp);
    }

    return transformAlbaranToLocalLike(albaran);
  } catch (e) {
    console.error("Error fetching albaran:", e);
    return null;
  }
}

function transformAlbaranToLocalLike(albaran: any) {
  return {
    id: albaran.id,
    tempId: albaran.tempId,
    fechaInicio: albaran.fechaInicio,
    calle: albaran.calle,
    ciudad: albaran.ciudad,
    policiaPlaca: albaran.policiaPlaca,
    policiaFirma: albaran.policiaFirma,
    infraccionId: albaran.infraccionId,
    userId: 'server-user',
    synced: 1,
    vehiculos: albaran.vehiculos.map((v: any) => ({
      id: v.id,
      matricula: v.matricula,
      marca: v.marca,
      modelo: v.modelo,
      esMoto: v.esMoto,
      esSobrepeso: v.esSobrepeso,
      fotos: v.fotos.map((f: any) => f.url)
    }))
  };
}
