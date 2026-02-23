import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 1. Protect /admin routes
    if (pathname.startsWith('/admin')) {
        // Allow access to login page logic
        if (pathname.startsWith('/admin/login')) {
            // Optional: If already logged in, redirect to dashboard? 
            // For now, just let it pass to avoid loops.
            return NextResponse.next();
        }

        const token = req.cookies.get('auth_token')?.value;
        const session = token ? await verifyToken(token) : null;

        // Check if user is authenticated and has a valid admin role
        const validRoles = ['ADMIN', 'SUPER_ADMIN', 'JEFE_EMPRESA'];
        if (!session || !validRoles.includes(session.role)) {
            const loginUrl = new URL('/admin/login', req.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
