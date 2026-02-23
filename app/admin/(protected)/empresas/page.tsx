import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export default async function EmpresasPage() {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
        redirect('/admin');
    }

    const empresas = await prisma.empresa.findMany({
        include: { _count: { select: { usuarios: true } } },
        orderBy: { createdAt: 'desc' }
    });

    async function crearEmpresa(formData: FormData) {
        'use server';
        const nombre = formData.get('nombre') as string;
        const cif = formData.get('cif') as string;

        if (!nombre) return;

        await prisma.empresa.create({
            data: { nombre, cif }
        });

        revalidatePath('/admin/empresas');
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Hero / Page Title */}
                <div className="mb-10">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Gestión de Empresas</h2>
                    <p className="text-slate-500 mt-2">Administre el directorio de empresas y controle los empleados activos en tiempo real.</p>
                </div>

                {/* Creation Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-10 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 text-slate-800">Crear Nueva Empresa</h3>
                    <form action={crearEmpresa} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Nombre de la Empresa</label>
                            <input
                                name="nombre"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                placeholder="Ej. Construcciones Paco S.L."
                                type="text"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">CIF</label>
                            <input
                                name="cif"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                placeholder="B12345678"
                                type="text"
                            />
                        </div>
                        <button type="submit" className="bg-blue-50 text-blue-700 border border-blue-200 font-bold py-3 px-6 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300">
                            Crear Empresa
                        </button>
                    </form>
                </div>

                {/* Companies Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-slate-800">Listado de Empresas</h3>
                        <div className="flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">filter_list</span>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">download</span>
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">Empresa</th>
                                    <th className="px-6 py-4 font-semibold">CIF</th>
                                    <th className="px-6 py-4 font-semibold text-center">Empleados Activos</th>
                                    <th className="px-6 py-4 font-semibold">Estado</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {empresas.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                                    <span className="material-symbols-outlined text-slate-500 text-xl">apartment</span>
                                                </div>
                                                <span className="font-bold text-slate-700">{emp.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-500 font-mono">
                                            {emp.cif || '-'}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                                                {emp._count.usuarios} empleados
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-2 rounded-full bg-green-500"></div>
                                                <span className="text-xs font-medium text-slate-600">Activa</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
                                                <span className="material-symbols-outlined">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {empresas.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500 bg-white">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">domain_disabled</span>
                                                <p className="font-medium">No hay empresas en el sistema.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
