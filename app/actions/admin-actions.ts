"use server";

import { prisma } from "@/lib/prisma";

export interface AdminDeletionResult {
    success: boolean;
    message?: string;
}

export interface BookingForAdmin {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    room_name: string;
    creator_name: string | null;
    creator_email: string | null;
    status: string;
}

export interface DeletionLog {
    id: string;
    booking_title: string;
    booking_start_time: string;
    room_name: string;
    deleted_by: string;
    deletion_reason: string | null;
    deleted_at: string;
}

/**
 * Busca todas as reservas futuras para o painel admin
 */
export async function getBookingsForAdmin(): Promise<BookingForAdmin[]> {
    const bookings = await prisma.booking.findMany({
        where: {
            // Remove future-only filter to show all bookings
        },
        include: {
            room: true,
        },
        orderBy: { startTime: "desc" },
    });

    return bookings.map((b) => ({
        id: b.id,
        title: b.title,
        start_time: b.startTime.toISOString(),
        end_time: b.endTime.toISOString(),
        room_name: b.room.name,
        creator_name: b.creatorName,
        creator_email: b.creatorEmail,
        status: b.status.toLowerCase(),
    }));
}

/**
 * Busca os logs de exclusão administrativa
 * Nota: A tabela admin_deletion_logs precisa ser criada se você quiser manter este recurso
 */
export async function getDeletionLogs(): Promise<DeletionLog[]> {
    // TODO: Implementar tabela AdminDeletionLog no schema se necessário
    // Por enquanto retorna array vazio
    return [];
}

/**
 * Exclui uma reserva diretamente (admin)
 */
export async function adminDeleteBooking(
    bookingId: string,
    deletedBy: string,
    reason?: string
): Promise<AdminDeletionResult> {
    try {
        // Buscar dados da reserva
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { room: true },
        });

        if (!booking) {
            return { success: false, message: "Reserva não encontrada." };
        }

        // TODO: Se precisar de log de auditoria, criar tabela AdminDeletionLog
        // Por enquanto apenas deleta
        console.log(`[ADMIN DELETE] Reserva ${bookingId} deletada por ${deletedBy}. Motivo: ${reason || "N/A"}`);

        // Deletar a reserva
        await prisma.booking.delete({
            where: { id: bookingId },
        });

        return { success: true };
    } catch (e) {
        console.error("Admin delete error:", e);
        return { success: false, message: "Erro inesperado ao excluir reserva." };
    }
}

/**
 * Cria uma nova filial
 */
export async function createBranch(data: {
    name: string;
    location: string;
    address?: string;
    timezone?: string;
}) {
    return prisma.branch.create({
        data: {
            name: data.name,
            location: data.location,
            address: data.address,
            timezone: data.timezone || "America/Sao_Paulo",
        },
    });
}

/**
 * Atualiza uma filial
 */
export async function updateBranch(id: string, data: {
    name?: string;
    location?: string;
    address?: string;
    timezone?: string;
    isActive?: boolean;
}) {
    return prisma.branch.update({
        where: { id },
        data,
    });
}

/**
 * Cria uma nova sala
 */
export async function createRoom(data: {
    branchId: string;
    name: string;
    capacity: number;
    description?: string;
    floor?: string;
    equipmentList?: string[];
}) {
    return prisma.room.create({
        data: {
            branchId: data.branchId,
            name: data.name,
            capacity: data.capacity,
            description: data.description,
            floor: data.floor,
            equipmentList: data.equipmentList || [],
        },
    });
}

/**
 * Atualiza uma sala
 */
export async function updateRoom(id: string, data: {
    name?: string;
    capacity?: number;
    description?: string;
    floor?: string;
    equipmentList?: string[];
    isActive?: boolean;
}) {
    return prisma.room.update({
        where: { id },
        data,
    });
}
