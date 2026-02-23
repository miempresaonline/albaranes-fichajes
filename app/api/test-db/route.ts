import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        await prisma.$connect();
        const count = await prisma.albaran.count();
        return NextResponse.json({ status: 'ok', message: 'Connected to DB', count });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: String(e) }, { status: 500 });
    }
}
