"use server";

import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("booking_details")
        .select("id, title, start_time, end_time, room_name, creator_name, creator_email, status")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Error fetching bookings for admin:", error);
        return [];
    }

    return data || [];
}

/**
 * Busca os logs de exclusão administrativa
 */
export async function getDeletionLogs(): Promise<DeletionLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("admin_deletion_logs")
        .select("id, booking_title, booking_start_time, room_name, deleted_by, deletion_reason, deleted_at")
        .order("deleted_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching deletion logs:", error);
        return [];
    }

    return data || [];
}

/**
 * Exclui uma reserva e registra o log de auditoria
 */
export async function adminDeleteBooking(
    bookingId: string,
    deletedBy: string,
    reason?: string
): Promise<AdminDeletionResult> {
    const supabase = await createClient();

    try {
        // 1. Buscar dados da reserva antes de excluir
        const { data: bookingData, error: fetchError } = await supabase
            .from("booking_details")
            .select("id, title, start_time, end_time, room_name, creator_name, creator_email")
            .eq("id", bookingId)
            .single();

        if (fetchError || !bookingData) {
            return { success: false, message: "Reserva não encontrada." };
        }

        // Type assertion para contornar limitação de tipagem do Supabase
        const booking = bookingData as {
            id: string;
            title: string;
            start_time: string;
            end_time: string;
            room_name: string;
            creator_name: string | null;
            creator_email: string | null;
        };

        // 2. Registrar no log de auditoria
        const { error: logError } = await supabase
            .from("admin_deletion_logs")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert({
                booking_id: bookingId,
                booking_title: booking.title,
                booking_start_time: booking.start_time,
                booking_end_time: booking.end_time,
                room_name: booking.room_name,
                creator_name: booking.creator_name,
                creator_email: booking.creator_email,
                deleted_by: deletedBy,
                deletion_reason: reason || null,
            } as any);

        if (logError) {
            console.error("Error creating deletion log:", logError);
            return { success: false, message: "Erro ao registrar log de exclusão." };
        }

        // 3. Excluir a reserva
        const { error: deleteError } = await supabase
            .from("bookings")
            .delete()
            .eq("id", bookingId);

        if (deleteError) {
            console.error("Error deleting booking:", deleteError);
            return { success: false, message: "Erro ao excluir reserva." };
        }

        return { success: true };
    } catch (e) {
        console.error("Admin delete error:", e);
        return { success: false, message: "Erro inesperado ao excluir reserva." };
    }
}
