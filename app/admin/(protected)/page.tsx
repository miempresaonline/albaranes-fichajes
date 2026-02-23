import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { FileText, Users, Map, Truck } from 'lucide-react';

export default async function AdminDashboard() {
    // Basic stats
    const ticketCount = await prisma.albaran.count();
    const userCount = await prisma.user.count();
    const municipioCount = await prisma.municipio.count();
    const vehicleCount = await prisma.vehiculoRetirado.count();

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<FileText className="h-8 w-8 text-blue-500" />} label="Servicios Totales" value={ticketCount} />
                <StatCard icon={<Truck className="h-8 w-8 text-indigo-500" />} label="Vehículos Retirados" value={vehicleCount} />
                <StatCard icon={<Users className="h-8 w-8 text-green-500" />} label="Usuarios" value={userCount} />
                <StatCard icon={<Map className="h-8 w-8 text-orange-500" />} label="Ayuntamientos" value={municipioCount} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-slate-500 text-sm">Próximamente: Gráfico de servicios últimos 30 días.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Servicios Pendientes</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-slate-500 text-sm">Próximamente: Listado de servicios en curso.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-full">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        {value}
                    </h3>
                </div>
            </CardContent>
        </Card>
    )
}
