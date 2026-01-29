"use server";

import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";

// ============================================================
// Types
// ============================================================

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

// ============================================================
// Server Actions
// ============================================================

/**
 * Lista todos os usuários com role ADMIN ou SUPERADMIN
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
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

/**
 * Cria um novo usuário admin
 */
export async function createAdminUser(
    data: CreateAdminUserData
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
    try {
        // Verificar se email já existe
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            return { success: false, message: "Email já cadastrado" };
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                email: data.email,
                fullName: data.fullName,
                password: hashedPassword,
                role: data.role,
            },
        });

        return {
            success: true,
            message: "Usuário criado com sucesso",
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role as "ADMIN" | "SUPERADMIN",
                createdAt: user.createdAt.toISOString(),
            },
        };
    } catch (error) {
        console.error("Erro ao criar usuário admin:", error);
        return { success: false, message: "Erro ao criar usuário" };
    }
}

/**
 * Atualiza um usuário admin existente
 */
export async function updateAdminUser(
    userId: string,
    data: UpdateAdminUserData
): Promise<{ success: boolean; message: string }> {
    try {
        const updateData: Record<string, unknown> = {};

        if (data.email) updateData.email = data.email;
        if (data.fullName) updateData.fullName = data.fullName;
        if (data.role) updateData.role = data.role;
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return { success: true, message: "Usuário atualizado com sucesso" };
    } catch (error) {
        console.error("Erro ao atualizar usuário admin:", error);
        return { success: false, message: "Erro ao atualizar usuário" };
    }
}

/**
 * Exclui um usuário admin
 */
export async function deleteAdminUser(
    userId: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Verificar quantos admins existem
        const adminCount = await prisma.user.count({
            where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
        });

        if (adminCount <= 1) {
            return {
                success: false,
                message: "Não é possível excluir o único administrador",
            };
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return { success: true, message: "Usuário excluído com sucesso" };
    } catch (error) {
        console.error("Erro ao excluir usuário admin:", error);
        return { success: false, message: "Erro ao excluir usuário" };
    }
}

/**
 * Verifica credenciais de admin (usado pela API de auth)
 */
export async function verifyAdminCredentials(
    email: string,
    password: string
): Promise<{ success: boolean; user?: AdminUser }> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            return { success: false };
        }

        // Verificar se é admin
        if (!["ADMIN", "SUPERADMIN"].includes(user.role)) {
            return { success: false };
        }

        // Verificar senha
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { success: false };
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role as "ADMIN" | "SUPERADMIN",
                createdAt: user.createdAt.toISOString(),
            },
        };
    } catch (error) {
        console.error("Erro ao verificar credenciais:", error);
        return { success: false };
    }
}

/**
 * Conta quantos admins existem no banco
 */
export async function countAdmins(): Promise<number> {
    return prisma.user.count({
        where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
    });
}
