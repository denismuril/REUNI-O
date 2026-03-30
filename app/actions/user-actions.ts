"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";

export interface AdminUser {
    id: string;
    email: string;
    fullName: string;
    role: "ADMIN" | "SUPERADMIN";
    createdAt: string;
}

export interface CreateAdminUserData {
    email: string;
    fullName: string;
    password: string;
    role: "ADMIN" | "SUPERADMIN";
}

export interface UpdateAdminUserData {
    email?: string;
    fullName?: string;
    password?: string;
    role?: "ADMIN" | "SUPERADMIN";
}

export async function getAdminUsers(): Promise<AdminUser[]> {
    await requireAdmin();

    const users = await prisma.user.findMany({
        where: {
            role: { in: ["ADMIN", "SUPERADMIN"] },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            createdAt: true,
        },
    });

    return users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as "ADMIN" | "SUPERADMIN",
        createdAt: user.createdAt.toISOString(),
    }));
}

export async function createAdminUser(
    data: CreateAdminUserData
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
    try {
        await requireSuperAdmin();

        const normalizedEmail = data.email.toLowerCase().trim();
        const fullName = data.fullName.trim();

        if (fullName.length < 2) {
            return { success: false, message: "Nome deve ter pelo menos 2 caracteres" };
        }

        if (data.password.length < 6) {
            return { success: false, message: "Senha deve ter pelo menos 6 caracteres" };
        }

        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existing) {
            return { success: false, message: "Email ja cadastrado" };
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                fullName,
                password: hashedPassword,
                role: data.role,
            },
        });

        return {
            success: true,
            message: "Usuario criado com sucesso",
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role as "ADMIN" | "SUPERADMIN",
                createdAt: user.createdAt.toISOString(),
            },
        };
    } catch (error) {
        console.error("Erro ao criar usuario admin:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Erro ao criar usuario",
        };
    }
}

export async function updateAdminUser(
    userId: string,
    data: UpdateAdminUserData
): Promise<{ success: boolean; message: string }> {
    try {
        await requireSuperAdmin();

        const updateData: Record<string, unknown> = {};

        if (data.email) updateData.email = data.email.toLowerCase().trim();
        if (data.fullName) {
            const fullName = data.fullName.trim();
            if (fullName.length < 2) {
                return { success: false, message: "Nome deve ter pelo menos 2 caracteres" };
            }
            updateData.fullName = fullName;
        }
        if (data.role) updateData.role = data.role;
        if (data.password) {
            if (data.password.length < 6) {
                return { success: false, message: "Senha deve ter pelo menos 6 caracteres" };
            }
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return { success: true, message: "Usuario atualizado com sucesso" };
    } catch (error) {
        console.error("Erro ao atualizar usuario admin:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Erro ao atualizar usuario",
        };
    }
}

export async function deleteAdminUser(
    userId: string
): Promise<{ success: boolean; message: string }> {
    try {
        const actor = await requireSuperAdmin();

        const adminCount = await prisma.user.count({
            where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
        });

        if (adminCount <= 1) {
            return {
                success: false,
                message: "Nao e possivel excluir o unico administrador",
            };
        }

        if (actor.id === userId) {
            return {
                success: false,
                message: "Nao e possivel excluir a propria conta.",
            };
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return { success: true, message: "Usuario excluido com sucesso" };
    } catch (error) {
        console.error("Erro ao excluir usuario admin:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Erro ao excluir usuario",
        };
    }
}
