import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

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

    const totalEntradas = fichajes.filter(f => f.tipo === 'ENTRADA').length;
    const totalPausas = fichajes.filter(f => f.tipo.includes('PAUSA')).length;
    const totalSalidas = fichajes.filter(f => f.tipo === 'SALIDA').length;

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f6f6f8] min-h-screen font-sans">
            {/* Title and Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Registro de Fichajes</h2>
                    <p className="text-slate-500 mt-1">Seguimiento detallado de la jornada laboral en tiempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                    <form className="flex items-center gap-2 px-4 py-2 text-slate-700 font-semibold" method="GET">
                        <span className="material-symbols-outlined text-lg text-slate-400">calendar_month</span>
                        <input
                            type="date"
                            name="date"
                            defaultValue={targetDate.toISOString().split('T')[0]}
                            className="bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 cursor-pointer"
                            onChange={(e) => e.target.form?.submit()}
                        />
                    </form>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2b6cee] text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">
                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                        Exportar a PDF
                    </button>
                </div>
            </div>

            {/* Filters & Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Entradas</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalEntradas}</h3>
                    <div className="flex items-center gap-1 mt-2 text-green-600">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="text-xs font-semibold">Inicios de jornada</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pausas Activas</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalPausas}</h3>
                    <div className="flex items-center gap-1 mt-2 text-amber-500">
                        <span className="material-symbols-outlined text-sm">pending</span>
                        <span className="text-xs font-semibold">Descansos</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Salidas</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalSalidas}</h3>
                    <div className="flex items-center gap-1 mt-2 text-slate-400">
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span className="text-xs font-semibold">Finalizaciones</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center border-dashed border-2">
                    <button className="flex flex-col items-center gap-1 text-[#2b6cee] hover:text-blue-800 transition-colors">
                        <span className="material-symbols-outlined text-3xl">add_circle</span>
                        <span className="text-sm font-bold">Fichaje Manual</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-slate-900">Historial de Fichajes - {targetDate.toLocaleDateString()}</h3>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                            <span className="material-symbols-outlined">filter_list</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f6f6f8]/80">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Empleado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Empresa</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Hora</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Dispositivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fichajes.map(f => (
                                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0">
                                                {(f.user.name || f.user.username)[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-slate-900 truncate">{f.user.name || f.user.username}</span>
                                                <span className="text-xs text-slate-500 truncate">Sede Principal</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                        {f.user.empresa?.nombre || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                        {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                                            ${f.tipo === 'ENTRADA' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                            ${f.tipo === 'SALIDA' ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                                            ${f.tipo.includes('PAUSA') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                        `}>
                                            <span className={`size-1.5 rounded-full ${f.tipo === 'ENTRADA' ? 'bg-green-600' :
                                                    f.tipo === 'SALIDA' ? 'bg-slate-500' : 'bg-yellow-600'
                                                }`}></span>
                                            {f.tipo.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span className="material-symbols-outlined text-lg">
                                                {f.dispositivo && f.dispositivo.toLowerCase().includes('mobile') ? 'smartphone' : 'laptop'}
                                            </span>
                                            <span className="text-xs truncate max-w-[120px]" title={f.dispositivo || 'N/A'}>
                                                {f.dispositivo || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {fichajes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500 bg-white">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-slate-300">history_toggle_off</span>
                                            <p className="font-medium">No hay registros de fichajes para este día.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
