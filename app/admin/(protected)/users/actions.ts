'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';

// Get all users (filtered by role optionally)
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Remove passwords from response
        return users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function createUser(data: any) {
    try {
        const hashedPassword = await hash(data.password, 10);
        await prisma.user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                name: data.name,
                email: data.email,
                role: data.role, // 'ADMIN' or 'GRUISTA'
                isActive: data.isActive
            }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function updateUser(id: string, data: any) {
    try {
        const updateData: any = {
            username: data.username,
            name: data.name,
            email: data.email,
            role: data.role,
            isActive: data.isActive
        };

        if (data.password) {
            updateData.password = await hash(data.password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
