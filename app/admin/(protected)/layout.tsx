import { getSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Map, FileText, AlertTriangle, LogOut, Settings, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.role !== 'ADMIN') {
        redirect('/admin/login');
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-4 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6 text-blue-400" />
                        Admin Panel
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavLink href="/admin" icon={<LayoutDashboard />} label="Dashboard" />
                    <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestión</div>
                    <NavLink href="/admin/users" icon={<Users />} label="Usuarios" />
                    <NavLink href="/admin/municipalities" icon={<Map />} label="Ayuntamientos y Tarifas" />
                    <NavLink href="/admin/services" icon={<TruckIcon />} label="Servicios" />
                    <NavLink href="/admin/infracciones" icon={<AlertTriangle />} label="Infracciones" />
                    <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuración</div>
                    <NavLink href="/admin/settings/festivos" icon={<Calendar />} label="Días Festivos" />
                    <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operaciones</div>
                    <NavLink href="/admin/tickets" icon={<FileText />} label="Albaranes" />
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                            {session.username[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{session.name}</p>
                            <p className="text-xs text-slate-400 truncate">{session.role}</p>
                        </div>
                    </div>

                    <form action={async () => {
                        'use server';
                        await logout();
                        redirect('/admin/login');
                    }}>
                        <Button variant="destructive" className="w-full justify-start" size="sm">
                            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Mobile Header (TODO) - For now focus on Desktop Admin */}

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
            {/* Clone icon to set size? Or assume icon is standardized */}
            <span className="h-5 w-5 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}

function TruckIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
    )
}
