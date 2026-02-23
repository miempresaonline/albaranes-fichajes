'use server';

import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

// Definimos el tipo aquí para no depender del de Prisma si falla la generación en el editor
type TipoFichaje = 'ENTRADA' | 'SALIDA' | 'PAUSA_INICIO' | 'PAUSA_FIN';

export async function registrarFichaje(
  tipo: TipoFichaje,
  geoLat?: number,
  geoLng?: number,
  dispositivo?: string
) {
  noStore();
  
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return { success: false, error: 'No autorizado. Inicie sesión.' };
    }

    const userId = session.id;

    // Validación de reglas de negocio sencilla:
    // No puedes hacer SALIDA si el último fichaje no fue ENTRADA o PAUSA_FIN, etc.
    const ultimoFichaje = await prisma.fichaje.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });

    if (ultimoFichaje) {
      const ultimoTipo = ultimoFichaje.tipo as TipoFichaje;
      if (tipo === 'ENTRADA' && ultimoTipo === 'ENTRADA') {
        return { success: false, error: 'Ya estás dentro de un turno.' };
      }
      if (tipo === 'SALIDA' && (ultimoTipo === 'SALIDA')) {
        return { success: false, error: 'Ya has finalizado el turno.' };
      }
      if (tipo === 'PAUSA_INICIO' && (ultimoTipo !== 'ENTRADA' && ultimoTipo !== 'PAUSA_FIN')) {
        return { success: false, error: 'Solo puedes pausar estando en turno.' };
      }
      if (tipo === 'PAUSA_FIN' && ultimoTipo !== 'PAUSA_INICIO') {
        return { success: false, error: 'No estás en pausa actualmente.' };
      }
    } else if (tipo !== 'ENTRADA') {
      return { success: false, error: 'Primero debes hacer una ENTRADA.' };
    }

    // Registramos la hora oficial del servidor (obligatorio por ley)
    const timestamp = new Date();

    const nuevoFichaje = await prisma.fichaje.create({
      data: {
        userId,
        tipo,
        timestamp,
        geoLat,
        geoLng,
        dispositivo
      }
    });

    revalidatePath('/fichaje'); // Refresh the main fichaje page
    return { success: true, data: nuevoFichaje };
  } catch (error: any) {
    console.error('Error registrando fichaje:', error);
    return { success: false, error: error.message || 'Error interno' };
  }
}

export async function getEstadoActual() {
  noStore();
  
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return { success: false, error: 'No autorizado' };
    }

    const ultimoFichaje = await prisma.fichaje.findFirst({
      where: { userId: session.id },
      orderBy: { timestamp: 'desc' }
    });

    // Determine current state based on last action
    let estado = 'FUERA_DE_TURNO';
    if (ultimoFichaje) {
      switch (ultimoFichaje.tipo) {
        case 'ENTRADA':
        case 'PAUSA_FIN':
          estado = 'TRABAJANDO';
          break;
        case 'PAUSA_INICIO':
          estado = 'EN_PAUSA';
          break;
        case 'SALIDA':
          estado = 'FUERA_DE_TURNO';
          break;
      }
    }

    return { 
      success: true, 
      estado, 
      ultimoFichaje: ultimoFichaje ? {
        ...ultimoFichaje,
        timestamp: ultimoFichaje.timestamp.toISOString()
      } : null 
    };
  } catch (error) {
    console.error('Error obteniendo estado actual:', error);
    return { success: false, error: 'Error obteniendo estado' };
  }
}

// Para administradores / jefes: OBTENER Fichajes
export async function getFichajes(fechaInicio: Date, fechaFin: Date, empleadoId?: string) {
  noStore();
  
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'No autorizado' };
    
    // Aquí se debería añadir control de roles: SUPER_ADMIN ve todos, JEFE_EMPRESA ve los de su empresa.
    // Por simplicidad en la acción básica:
    const whereClause: any = {
      timestamp: {
        gte: fechaInicio,
        lte: fechaFin
      }
    };
    
    if (empleadoId) {
      whereClause.userId = empleadoId;
    }

    const fichajes = await prisma.fichaje.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, username: true } }
      },
      orderBy: { timestamp: 'desc' } // Most recent first
    });

    return { 
      success: true, 
      data: fichajes.map(f => ({
         ...f, 
         timestamp: f.timestamp.toISOString() 
      })) 
    };

  } catch (err: any) {
    console.error(err);
    return { success: false, error: 'Error obteniendo fichajes' };
  }
}
