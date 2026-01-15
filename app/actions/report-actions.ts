"use server";

import { createClient } from "@/lib/supabase/server";

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

// Type helper para resultados de queries do Supabase
interface BookingDetailRow {
    room_id: string;
    room_name: string;
    branch_name: string;
    room_color: string | null;
    start_time: string;
    end_time: string;
    creator_email: string | null;
    creator_name: string | null;
    status: string;
}

/**
 * Busca estatísticas de ocupação por sala
 */
export async function getOccupancyByRoom(
    startDate: Date,
    endDate: Date
): Promise<{ data: OccupancyStats[]; error?: string }> {
    try {
        const supabase = await createClient();

        const { data: bookings, error } = await supabase
            .from("booking_details")
            .select("room_id, room_name, branch_name, room_color, start_time, end_time")
            .gte("start_time", startDate.toISOString())
            .lte("end_time", endDate.toISOString())
            .eq("status", "confirmed");

        if (error) {
            return { data: [], error: error.message };
        }

        // Agrupar por sala
        const roomStats = new Map<string, OccupancyStats>();
        const bookingList = (bookings || []) as BookingDetailRow[];

        bookingList.forEach((booking) => {
            const roomId = booking.room_id;
            const hours =
                (new Date(booking.end_time).getTime() -
                    new Date(booking.start_time).getTime()) /
                (1000 * 60 * 60);

            if (!roomStats.has(roomId)) {
                roomStats.set(roomId, {
                    roomId,
                    roomName: booking.room_name,
                    branchName: booking.branch_name,
                    totalBookings: 0,
                    totalHours: 0,
                    color: booking.room_color || "#3B82F6",
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
        const supabase = await createClient();

        const { data: bookings, error } = await supabase
            .from("bookings")
            .select("start_time")
            .gte("start_time", startDate.toISOString())
            .lte("start_time", endDate.toISOString())
            .eq("status", "confirmed");

        if (error) {
            return { data: [], error: error.message };
        }

        // Contar por hora
        const hourCounts = new Map<number, number>();
        for (let h = 8; h <= 18; h++) {
            hourCounts.set(h, 0);
        }

        const bookingList = (bookings || []) as { start_time: string }[];

        bookingList.forEach((booking) => {
            const hour = new Date(booking.start_time).getHours();
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
        const supabase = await createClient();

        const { data: bookings, error } = await supabase
            .from("bookings")
            .select("creator_email, creator_name, start_time, end_time")
            .gte("start_time", startDate.toISOString())
            .lte("end_time", endDate.toISOString())
            .eq("status", "confirmed");

        if (error) {
            return { data: [], error: error.message };
        }

        // Agrupar por usuário
        const userStats = new Map<string, TopUserStats>();
        const bookingList = (bookings || []) as { creator_email: string | null; creator_name: string | null; start_time: string; end_time: string }[];

        bookingList.forEach((booking) => {
            const email = booking.creator_email || "Desconhecido";
            const hours =
                (new Date(booking.end_time).getTime() -
                    new Date(booking.start_time).getTime()) /
                (1000 * 60 * 60);

            if (!userStats.has(email)) {
                userStats.set(email, {
                    email,
                    name: booking.creator_name || email.split("@")[0],
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

        const supabase = await createClient();

        const { data: bookings, error } = await supabase
            .from("booking_details")
            .select("room_name, start_time, end_time")
            .gte("start_time", startDate.toISOString())
            .lte("end_time", endDate.toISOString())
            .eq("status", "confirmed");

        if (error) {
            return { data: null, error: error.message };
        }

        if (!bookings || bookings.length === 0) {
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
        const bookingList = (bookings || []) as { room_name: string; start_time: string; end_time: string }[];

        bookingList.forEach((booking) => {
            const hours =
                (new Date(booking.end_time).getTime() -
                    new Date(booking.start_time).getTime()) /
                (1000 * 60 * 60);
            totalHours += hours;

            // Contar por sala
            const room = booking.room_name;
            roomCounts.set(room, (roomCounts.get(room) || 0) + 1);

            // Contar por dia
            const day = new Date(booking.start_time).toISOString().split("T")[0];
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
