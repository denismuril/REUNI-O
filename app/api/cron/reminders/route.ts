import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { getBookingReminderTemplate } from "@/lib/email-templates";

// Esta rota deve ser protegida com um segredo
const CRON_SECRET = process.env.CRON_SECRET || "default_cron_secret";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // Autenticação simples via Header
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        // Buscar reservas que começam nas próximas 1-2 horas e ainda não foram notificadas
        // Nota: Para um sistema completo, você precisaria de uma tabela de notificações enviadas
        // Por simplicidade, buscaremos reservas que começam em ~1 hora
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const upcomingBookings = await prisma.booking.findMany({
            where: {
                startTime: {
                    gte: oneHourFromNow,
                    lt: twoHoursFromNow,
                },
                status: "CONFIRMED",
            },
            include: {
                room: true,
            },
        });

        if (upcomingBookings.length === 0) {
            return NextResponse.json({ message: "No upcoming bookings to notify" });
        }

        const stats = {
            processed: 0,
            sent: 0,
            failed: 0,
        };

        for (const booking of upcomingBookings) {
            stats.processed++;

            try {
                const html = getBookingReminderTemplate({
                    title: booking.title,
                    roomName: booking.room.name,
                    date: booking.startTime.toLocaleDateString("pt-BR"),
                    startTime: booking.startTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    endTime: booking.endTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    creatorName: booking.creatorName,
                });

                if (process.env.RESEND_API_KEY) {
                    await resend.emails.send({
                        from: "RESERVA <noreply@reuniao.bexp.com.br>",
                        to: booking.creatorEmail,
                        subject: `Lembrete: ${booking.title} começa em 1 hora`,
                        html: html,
                    });
                    stats.sent++;
                } else {
                    console.log(`[DEV] Email simulado para ${booking.creatorEmail}`);
                    stats.sent++;
                }
            } catch (err) {
                console.error(`Erro ao enviar lembrete para booking ${booking.id}:`, err);
                stats.failed++;
            }
        }

        return NextResponse.json({
            success: true,
            stats,
            message: `Processed ${stats.processed} bookings`,
        });

    } catch (err) {
        console.error("Erro interno no cron:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
