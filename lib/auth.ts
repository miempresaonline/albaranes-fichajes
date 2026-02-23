import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-this';
const key = new TextEncoder().encode(SECRET_KEY);

const ALG = 'HS256';

export async function signToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('24h') // 24 hours session
        .sign(key);
}

export interface UserSession {
    id: string;
    username: string;
    role: string;
    name: string;
    [key: string]: any;
}

export async function verifyToken(token: string): Promise<UserSession | null> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: [ALG],
        });
        return payload as unknown as UserSession;
    } catch (e) {
        return null;
    }
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return await verifyToken(token);
}

export async function login(userData: { id: string; username: string; role: string; name: string }) {
    // Create token
    const token = await signToken(userData);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
}
