"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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

export async function getBookingsForAdmin(): Promise<BookingForAdmin[]> {
    await requireAdmin();

    const bookings = await prisma.booking.findMany({
        include: {
            room: true,
        },
        orderBy: { startTime: "desc" },
    });

    return bookings.map((booking) => ({
        id: booking.id,
        title: booking.title,
        start_time: booking.startTime.toISOString(),
        end_time: booking.endTime.toISOString(),
        room_name: booking.room.name,
        creator_name: booking.creatorName,
        creator_email: booking.creatorEmail,
        status: booking.status.toLowerCase(),
    }));
}

export async function getDeletionLogs(): Promise<DeletionLog[]> {
    await requireAdmin();
    return [];
}

export async function adminDeleteBooking(
    bookingId: string,
    reason?: string
): Promise<AdminDeletionResult> {
    try {
        const actor = await requireAdmin();

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: true,
                childBookings: {
                    select: { id: true },
                },
            },
        });

        if (!booking) {
            return { success: false, message: "Reserva nao encontrada." };
        }

        if (booking.status === "CANCELLED") {
            return { success: false, message: "Esta reserva ja foi cancelada." };
        }

        const bookingIdsToCancel = booking.parentBookingId
            ? [booking.id]
            : [booking.id, ...booking.childBookings.map((child) => child.id)];

        await prisma.booking.updateMany({
            where: {
                id: { in: bookingIdsToCancel },
            },
            data: {
                status: "CANCELLED",
            },
        });

        console.log(
            `[ADMIN CANCEL] Reserva ${bookingId} cancelada por ${actor.email}. Motivo: ${reason || "N/A"}`
        );

        return {
            success: true,
            message: bookingIdsToCancel.length > 1
                ? "Reserva e recorrencias canceladas com sucesso."
                : "Reserva cancelada com sucesso.",
        };
    } catch (error) {
        console.error("Admin cancel error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Erro inesperado ao cancelar reserva.",
        };
    }
}

export async function createBranch(data: {
    name: string;
    location: string;
    address?: string;
    timezone?: string;
}) {
    await requireAdmin();

    const name = data.name.trim();
    const location = data.location.trim();

    if (name.length < 2 || location.length < 2) {
        throw new Error("Nome e localizacao da filial devem ter pelo menos 2 caracteres.");
    }

    return prisma.branch.create({
        data: {
            name,
            location,
            address: data.address?.trim(),
            timezone: data.timezone || "America/Sao_Paulo",
        },
    });
}

export async function updateBranch(id: string, data: {
    name?: string;
    location?: string;
    address?: string;
    timezone?: string;
    isActive?: boolean;
}) {
    await requireAdmin();

    if (data.name && data.name.trim().length < 2) {
        throw new Error("O nome da filial deve ter pelo menos 2 caracteres.");
    }

    if (data.location && data.location.trim().length < 2) {
        throw new Error("A localizacao da filial deve ter pelo menos 2 caracteres.");
    }

    return prisma.branch.update({
        where: { id },
        data: {
            ...data,
            name: data.name?.trim(),
            location: data.location?.trim(),
            address: data.address?.trim(),
        },
    });
}

export async function createRoom(data: {
    branchId: string;
    name: string;
    capacity: number;
    description?: string;
    floor?: string;
    equipmentList?: string[];
}) {
    await requireAdmin();

    const name = data.name.trim();
    if (name.length < 2) {
        throw new Error("O nome da sala deve ter pelo menos 2 caracteres.");
    }

    if (data.capacity < 1) {
        throw new Error("A capacidade minima da sala e 1.");
    }

    return prisma.room.create({
        data: {
            branchId: data.branchId,
            name,
            capacity: data.capacity,
            description: data.description?.trim(),
            floor: data.floor?.trim(),
            equipmentList: data.equipmentList || [],
        },
    });
}

export async function updateRoom(id: string, data: {
    name?: string;
    capacity?: number;
    description?: string;
    floor?: string;
    equipmentList?: string[];
    isActive?: boolean;
}) {
    await requireAdmin();

    if (data.name && data.name.trim().length < 2) {
        throw new Error("O nome da sala deve ter pelo menos 2 caracteres.");
    }

    if (typeof data.capacity === "number" && data.capacity < 1) {
        throw new Error("A capacidade minima da sala e 1.");
    }

    return prisma.room.update({
        where: { id },
        data: {
            ...data,
            name: data.name?.trim(),
            description: data.description?.trim(),
            floor: data.floor?.trim(),
        },
    });
}
