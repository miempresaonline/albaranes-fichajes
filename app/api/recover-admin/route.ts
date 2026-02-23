import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple security
    if (secret !== 'recover123') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminPass = await bcrypt.hash('admin', 10);

        const user = await prisma.user.upsert({
            where: { username: 'admin' },
            update: { password: adminPass, role: 'SUPER_ADMIN', isActive: true },
            create: {
                username: 'admin',
                password: adminPass,
                role: 'SUPER_ADMIN',
                name: 'Administrador Recovery',
                email: 'admin@example.com',
                isActive: true
            }
        });

        return NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
