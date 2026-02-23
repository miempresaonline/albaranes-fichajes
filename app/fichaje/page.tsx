import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FichajeWidget } from '@/components/fichajes/FichajeWidget';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { logout } from '@/lib/auth';

export const metadata = {
    title: 'Control de Horario',
    description: 'Registro de jornada laboral'
};

export default async function FichajePage() {
    const session = await getSession();

    if (!session) {
        redirect('/admin/login'); // Or the correct login path
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                        {session.name ? session.name[0].toUpperCase() : session.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-800 leading-tight">{session.name || session.username}</h1>
                        <p className="text-xs text-slate-500">Registro de Jornada</p>
                    </div>
                </div>

                <form action={async () => {
                    'use server';
                    await logout();
                    redirect('/admin/login');
                }}>
                    <button type="submit" className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full">
                        <LogOut className="w-5 h-5" />
                    </button>
                </form>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col gap-6 pt-8">
                <div className="text-center space-y-2 mb-2">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tu Jornada</h2>
                    <p className="text-sm text-slate-500">Registra tus entradas y salidas cumpliendo con la normativa vigente.</p>
                </div>

                {/* The interactive widget */}
                <FichajeWidget />

                {/* Additional links for workers, like "Mis tickets" if they are GRUISTA */}
                {session.role === 'GRUISTA' && (
                    <div className="mt-8">
                        <Link href="/" className="block w-full py-4 text-center bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
                            Ir a Mis Albaranes
                        </Link>
                    </div>
                )}

                {/* If they are JEFE_EMPRESA or SUPER_ADMIN, they can go to Admin Panel */}
                {(session.role === 'SUPER_ADMIN' || session.role === 'JEFE_EMPRESA') && (
                    <div className="mt-4">
                        <Link href="/admin" className="block w-full py-4 text-center bg-slate-800 text-white font-semibold rounded-2xl shadow-md hover:bg-slate-900 transition-colors">
                            Panel de Administración
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
