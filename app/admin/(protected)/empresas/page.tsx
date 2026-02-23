import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

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
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                Gestión de Empresas
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>Nueva Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={crearEmpresa} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-1">
                            <label className="text-sm font-medium">Nombre de la Empresa</label>
                            <input name="nombre" type="text" className="w-full border rounded-md p-2" required />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-sm font-medium">CIF</label>
                            <input name="cif" type="text" className="w-full border rounded-md p-2" />
                        </div>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Crear</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="bg-white rounded-xl shadow border">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b">
                            <th className="p-4 font-medium text-slate-500">Empresa</th>
                            <th className="p-4 font-medium text-slate-500">CIF</th>
                            <th className="p-4 font-medium text-slate-500">Empleados</th>
                            <th className="p-4 font-medium text-slate-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {empresas.map(emp => (
                            <tr key={emp.id} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-900">{emp.nombre}</td>
                                <td className="p-4 text-slate-600">{emp.cif || '-'}</td>
                                <td className="p-4">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                                        {emp._count.usuarios}
                                    </span>
                                </td>
                                <td className="p-4 space-x-2">
                                    <Button variant="outline" size="sm">Editar</Button>
                                </td>
                            </tr>
                        ))}
                        {empresas.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500">No hay empresas registradas</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
