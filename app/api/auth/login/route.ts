import { prisma } from '@/lib/prisma';
import { login } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 401 });
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
        }

        // Login successful
        await login({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name || user.username
        });

        return NextResponse.json({ success: true, role: user.role });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
