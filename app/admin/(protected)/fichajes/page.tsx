import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Registro de Jornada - Admin' };

export default async function FichajesAdminPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string, empresaId?: string }>
}) {
    const session = await getSession();

    if (!session || !['ADMIN', 'SUPER_ADMIN', 'JEFE_EMPRESA'].includes(session.role)) {
        redirect('/admin/login');
    }

    const resolvedParams = await searchParams;

    // Determine target date (default today)
    const targetDate = resolvedParams?.date ? new Date(resolvedParams.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query based on role
    const whereClause: any = {
        timestamp: {
            gte: targetDate,
            lte: endOfDay
        }
    };

    if (session.role === 'JEFE_EMPRESA') {
        // En un caso real, el JEFE_EMPRESA solo vería los usuarios de SU empresa.
        // Aquí asumimos que el Usuario "Jefe" tiene su empresaId asignado.
        const jefeUser = await prisma.user.findUnique({ where: { id: session.id } });
        if (jefeUser?.empresaId) {
            whereClause.user = { empresaId: jefeUser.empresaId };
        }
    }

    const fichajes = await prisma.fichaje.findMany({
        where: whereClause,
        include: {
            user: {
                select: { name: true, username: true, empresa: { select: { nombre: true } } }
            }
        },
        orderBy: { timestamp: 'desc' }
    });

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-emerald-600" />
                    Registro de Jornada (Fichajes)
                </h1>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Exportar Informe Mensual (PDF)
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-slate-700">
                        Registros del día: {targetDate.toLocaleDateString()}
                    </h2>
                    {/* Filtros simples */}
                    <input
                        type="date"
                        defaultValue={targetDate.toISOString().split('T')[0]}
                        className="border rounded p-1 text-sm text-slate-600"
                    // Add client-router logic for navigation if needed later
                    />
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b text-xs uppercase tracking-wider text-slate-500">
                            <th className="p-4 font-medium">Hora</th>
                            <th className="p-4 font-medium">Empleado</th>
                            <th className="p-4 font-medium">Empresa</th>
                            <th className="p-4 font-medium">Acción</th>
                            <th className="p-4 font-medium">IP / Dispositivo</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {fichajes.map(f => (
                            <tr key={f.id} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-700">
                                    {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="p-4 font-medium">
                                    {f.user.name || f.user.username}
                                </td>
                                <td className="p-4 text-slate-600">
                                    {f.user.empresa?.nombre || '-'}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block border
                                        ${f.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : ''}
                                        ${f.tipo === 'SALIDA' ? 'bg-slate-100 text-slate-800 border-slate-200' : ''}
                                        ${f.tipo.includes('PAUSA') ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
                                    `}>
                                        {f.tipo.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-slate-400 max-w-[200px] truncate" title={f.dispositivo || 'N/A'}>
                                    {f.dispositivo || 'N/A'}
                                </td>
                            </tr>
                        ))}
                        {fichajes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No hay registros para este día.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
