"use server";

import { prisma } from "@/lib/prisma";

export interface OccupancyStats {
    roomId: string;
    roomName: string;
    branchName: string;
    totalBookings: number;
    totalHours: number;
    color: string;
}

export interface PeakHourStats {
    hour: number;
    bookings: number;
}

export interface TopUserStats {
    email: string;
    name: string;
    totalBookings: number;
    totalHours: number;
}

export interface MonthlyStats {
    totalBookings: number;
    totalHours: number;
    totalRooms: number;
    avgBookingsPerDay: number;
    mostUsedRoom: string;
    peakDay: string;
}

/**
 * Busca estatísticas de ocupação por sala
 */
export async function getOccupancyByRoom(
    startDate: Date,
    endDate: Date
): Promise<{ data: OccupancyStats[]; error?: string }> {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate },
                status: "CONFIRMED",
            },
            include: {
                room: {
                    include: { branch: true },
                },
            },
        });

        // Agrupar por sala
        const roomStats = new Map<string, OccupancyStats>();

        bookings.forEach((booking) => {
            const roomId = booking.roomId;
            const hours =
                (booking.endTime.getTime() - booking.startTime.getTime()) /
                (1000 * 60 * 60);

            if (!roomStats.has(roomId)) {
                roomStats.set(roomId, {
                    roomId,
                    roomName: booking.room.name,
                    branchName: booking.room.branch.name,
                    totalBookings: 0,
                    totalHours: 0,
                    color: "#3B82F6",
                });
            }

            const stats = roomStats.get(roomId)!;
            stats.totalBookings += 1;
            stats.totalHours += hours;
        });

        return {
            data: Array.from(roomStats.values()).sort(
                (a, b) => b.totalBookings - a.totalBookings
            ),
        };
    } catch (err) {
        console.error("[Reports] Erro ao buscar ocupação:", err);
        return { data: [], error: "Erro interno ao buscar dados" };
    }
}

/**
 * Busca estatísticas de horários de pico
 */
export async function getPeakHours(
    startDate: Date,
    endDate: Date
): Promise<{ data: PeakHourStats[]; error?: string }> {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: startDate, lte: endDate },
                status: "CONFIRMED",
            },
            select: { startTime: true },
        });

        // Contar por hora
        const hourCounts = new Map<number, number>();
        for (let h = 8; h <= 18; h++) {
            hourCounts.set(h, 0);
        }

        bookings.forEach((booking) => {
            const hour = booking.startTime.getHours();
            if (hourCounts.has(hour)) {
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            }
        });

        return {
            data: Array.from(hourCounts.entries()).map(([hour, bookings]) => ({
                hour,
                bookings,
            })),
        };
    } catch (err) {
        console.error("[Reports] Erro ao buscar horários de pico:", err);
        return { data: [], error: "Erro interno ao buscar dados" };
    }
}

/**
 * Busca top usuários por número de reservas
 */
export async function getTopUsers(
    limit: number = 10,
    startDate: Date,
    endDate: Date
): Promise<{ data: TopUserStats[]; error?: string }> {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate },
                status: "CONFIRMED",
            },
            select: {
                creatorEmail: true,
                creatorName: true,
                startTime: true,
                endTime: true,
            },
        });

        // Agrupar por usuário
        const userStats = new Map<string, TopUserStats>();

        bookings.forEach((booking) => {
            const email = booking.creatorEmail || "Desconhecido";
            const hours =
                (booking.endTime.getTime() - booking.startTime.getTime()) /
                (1000 * 60 * 60);

            if (!userStats.has(email)) {
                userStats.set(email, {
                    email,
                    name: booking.creatorName || email.split("@")[0],
                    totalBookings: 0,
                    totalHours: 0,
                });
            }

            const stats = userStats.get(email)!;
            stats.totalBookings += 1;
            stats.totalHours += hours;
        });

        return {
            data: Array.from(userStats.values())
                .sort((a, b) => b.totalBookings - a.totalBookings)
                .slice(0, limit),
        };
    } catch (err) {
        console.error("[Reports] Erro ao buscar top usuários:", err);
        return { data: [], error: "Erro interno ao buscar dados" };
    }
}

/**
 * Busca estatísticas mensais resumidas
 */
export async function getMonthlyStats(
    year: number,
    month: number
): Promise<{ data: MonthlyStats | null; error?: string }> {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const daysInMonth = endDate.getDate();

        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate },
                status: "CONFIRMED",
            },
            include: {
                room: true,
            },
        });

        if (bookings.length === 0) {
            return {
                data: {
                    totalBookings: 0,
                    totalHours: 0,
                    totalRooms: 0,
                    avgBookingsPerDay: 0,
                    mostUsedRoom: "N/A",
                    peakDay: "N/A",
                },
            };
        }

        // Calcular estatísticas
        let totalHours = 0;
        const roomCounts = new Map<string, number>();
        const dayCounts = new Map<string, number>();

        bookings.forEach((booking) => {
            const hours =
                (booking.endTime.getTime() - booking.startTime.getTime()) /
                (1000 * 60 * 60);
            totalHours += hours;

            // Contar por sala
            const room = booking.room.name;
            roomCounts.set(room, (roomCounts.get(room) || 0) + 1);

            // Contar por dia
            const day = booking.startTime.toISOString().split("T")[0];
            dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
        });

        // Encontrar sala mais usada
        let mostUsedRoom = "N/A";
        let maxRoomCount = 0;
        roomCounts.forEach((count, room) => {
            if (count > maxRoomCount) {
                maxRoomCount = count;
                mostUsedRoom = room;
            }
        });

        // Encontrar dia de pico
        let peakDay = "N/A";
        let maxDayCount = 0;
        dayCounts.forEach((count, day) => {
            if (count > maxDayCount) {
                maxDayCount = count;
                peakDay = new Date(day).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                });
            }
        });

        return {
            data: {
                totalBookings: bookings.length,
                totalHours: Math.round(totalHours * 10) / 10,
                totalRooms: roomCounts.size,
                avgBookingsPerDay: Math.round((bookings.length / daysInMonth) * 10) / 10,
                mostUsedRoom,
                peakDay,
            },
        };
    } catch (err) {
        console.error("[Reports] Erro ao buscar estatísticas mensais:", err);
        return { data: null, error: "Erro interno ao buscar dados" };
    }
}
