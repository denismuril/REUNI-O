"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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

function getDaysBetween(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export async function getOccupancyByRoom(
    startDate: Date,
    endDate: Date
): Promise<{ data: OccupancyStats[]; error?: string }> {
    try {
        await requireAdmin();

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
    } catch (error) {
        console.error("[Reports] Erro ao buscar ocupacao:", error);
        return { data: [], error: "Erro interno ao buscar dados" };
    }
}

export async function getPeakHours(
    startDate: Date,
    endDate: Date
): Promise<{ data: PeakHourStats[]; error?: string }> {
    try {
        await requireAdmin();

        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: startDate, lte: endDate },
                status: "CONFIRMED",
            },
            select: { startTime: true },
        });

        const hourCounts = new Map<number, number>();
        for (let hour = 8; hour <= 18; hour++) {
            hourCounts.set(hour, 0);
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
    } catch (error) {
        console.error("[Reports] Erro ao buscar horarios de pico:", error);
        return { data: [], error: "Erro interno ao buscar dados" };
    }
}

export async function getTopUsers(
    limit: number = 10,
    startDate: Date,
    endDate: Date
): Promise<{ data: TopUserStats[]; error?: string }> {
    try {
        await requireAdmin();

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

        const userStats = new Map<string, TopUserStats>();

        bookings.forEach((booking) => {
            const email = booking.creatorEmail || "desconhecido";
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
    } catch (error) {
        console.error("[Reports] Erro ao buscar top usuarios:", error);
        return { data: [], error: "Erro interno ao buscar dados" };
    }
}

export async function getSummaryStats(
    startDate: Date,
    endDate: Date
): Promise<{ data: MonthlyStats | null; error?: string }> {
    try {
        await requireAdmin();

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

        let totalHours = 0;
        const roomCounts = new Map<string, number>();
        const dayCounts = new Map<string, number>();

        bookings.forEach((booking) => {
            const hours =
                (booking.endTime.getTime() - booking.startTime.getTime()) /
                (1000 * 60 * 60);
            totalHours += hours;

            roomCounts.set(booking.room.name, (roomCounts.get(booking.room.name) || 0) + 1);

            const day = booking.startTime.toISOString().split("T")[0];
            dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
        });

        let mostUsedRoom = "N/A";
        let maxRoomCount = 0;
        roomCounts.forEach((count, room) => {
            if (count > maxRoomCount) {
                maxRoomCount = count;
                mostUsedRoom = room;
            }
        });

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
                avgBookingsPerDay: Math.round((bookings.length / getDaysBetween(startDate, endDate)) * 10) / 10,
                mostUsedRoom,
                peakDay,
            },
        };
    } catch (error) {
        console.error("[Reports] Erro ao buscar resumo:", error);
        return { data: null, error: "Erro interno ao buscar dados" };
    }
}

export async function getMonthlyStats(
    year: number,
    month: number
): Promise<{ data: MonthlyStats | null; error?: string }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return getSummaryStats(startDate, endDate);
}
