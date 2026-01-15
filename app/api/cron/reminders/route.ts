import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { getBookingReminderTemplate } from "@/lib/email-templates";

// Esta rota deve ser protegida com um segredo
const CRON_SECRET = process.env.CRON_SECRET || "default_cron_secret";

export const dynamic = "force-dynamic"; // Garantir que não seja cacheado

export async function GET(request: Request) {
    // Autenticação simples via Header
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        // 1. Buscar notificações pendentes vencidas
        const now = new Date().toISOString();
        const { data: notifications, error } = await (supabase
            .from("scheduled_notifications")
            .select(`
                id,
                type,
                booking_id,
                bookings (
                    title,
                    room_name,
                    start_time,
                    end_time,
                    creator_name,
                    creator_email
                )
            `)
            .eq("status", "pending")
            .lte("scheduled_for", now)
            .limit(50) as any); // Processar em lotes

        if (error) {
            console.error("Erro ao buscar notificações:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!notifications || notifications.length === 0) {
            return NextResponse.json({ message: "No pending notifications" });
        }

        const stats = {
            processed: 0,
            sent: 0,
            failed: 0,
        };

        // Type for notification with booking data
        type NotificationWithBooking = {
            id: string;
            type: string;
            booking_id: string;
            bookings: {
                title: string;
                room_name: string;
                start_time: string;
                end_time: string;
                creator_name: string;
                creator_email: string;
            } | null;
        };

        // 2. Processar cada notificação
        for (const notification of (notifications as NotificationWithBooking[])) {
            stats.processed++;
            const booking = notification.bookings;

            // Se a reserva foi deletada ou não encontrada, cancelar notificação
            if (!booking) {
                await (supabase.from("scheduled_notifications") as any)
                    .update({ status: "cancelled", processed_at: new Date().toISOString() })
                    .eq("id", notification.id);
                continue;
            }

            try {
                // Montar email
                const startDate = new Date(booking.start_time);
                const endDate = new Date(booking.end_time);
                const html = getBookingReminderTemplate({
                    title: booking.title,
                    roomName: booking.room_name,
                    date: startDate.toLocaleDateString("pt-BR"),
                    startTime: startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    endTime: endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    creatorName: booking.creator_name,
                });

                // Enviar
                if (process.env.RESEND_API_KEY) {
                    await resend.emails.send({
                        from: "RESERVA <noreply@bexp.com.br>",
                        to: booking.creator_email,
                        subject: `Lembrete: ${booking.title} começa em 1 hora`,
                        html: html,
                    });

                    // Marcar como enviado
                    await (supabase.from("scheduled_notifications") as any)
                        .update({ status: "sent", processed_at: new Date().toISOString() })
                        .eq("id", notification.id);

                    stats.sent++;
                } else {
                    // Simular envio em dev sem chave
                    console.log(`[DEV] Email simulado para ${booking.creator_email}`);
                    await (supabase.from("scheduled_notifications") as any)
                        .update({ status: "sent", processed_at: new Date().toISOString() })
                        .eq("id", notification.id);

                    stats.sent++;
                }
            } catch (err) {
                console.error(`Erro ao enviar notificação ${notification.id}:`, err);
                // Marcar como falha
                await (supabase.from("scheduled_notifications") as any)
                    .update({ status: "failed", processed_at: new Date().toISOString() })
                    .eq("id", notification.id);

                stats.failed++;
            }
        }

        return NextResponse.json({
            success: true,
            stats,
            message: `Processed ${stats.processed} notifications`,
        });

    } catch (err) {
        console.error("Erro interno no cron:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
