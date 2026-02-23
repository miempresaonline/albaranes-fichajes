import type { Metadata, Viewport } from "next";
export const dynamic = 'force-dynamic';
import { Inter } from "next/font/google";
import "./globals.css";
import { SyncProvider } from "@/components/SyncProvider";
import { ReloadPrompt } from "@/components/pwa/ReloadPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";




const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Gestión de Grúas Municipal",
    description: "Plataforma de gestión de retiradas de vehículos",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom on mobile inputs
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <main className="min-h-screen bg-slate-50 text-slate-900 pb-8">
                    <ServiceWorkerRegister />
                    <ReloadPrompt />
                    <SyncProvider />
                    {children}
                </main>
                <footer className="fixed bottom-0 w-full text-center text-[10px] text-slate-400 bg-slate-50/80 backdrop-blur p-1 z-50 pointer-events-auto flex justify-center gap-4 items-center">
                    <span>v3.22.0 - Panel Administración</span>

                </footer>
            </body>
        </html>
    );
}
