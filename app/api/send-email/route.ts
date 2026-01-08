import { NextRequest, NextResponse } from "next/server";
import { EmailNotificationPayload } from "@/types/booking";

/**
 * API Route para envio de emails de notificação
 * 
 * Esta é uma implementação placeholder. Para produção, integre com:
 * - Resend (https://resend.com)
 * - SendGrid (https://sendgrid.com)
 * - Amazon SES
 * - Nodemailer com SMTP
 */

export async function POST(request: NextRequest) {
    try {
        const body: EmailNotificationPayload = await request.json();

        // Validação básica
        if (!body.type || !body.booking || !body.recipientEmail) {
            return NextResponse.json(
                { error: "Dados incompletos para envio de email" },
                { status: 400 }
            );
        }

        // Gera o conteúdo do email baseado no tipo
        const emailContent = generateEmailContent(body);

        // TODO: Implementar integração real com serviço de email
        // Exemplo com Resend:
        //
        // import { Resend } from 'resend';
        // const resend = new Resend(process.env.RESEND_API_KEY);
        //
        // await resend.emails.send({
        //   from: 'reservas@suaempresa.com',
        //   to: body.recipientEmail,
        //   subject: emailContent.subject,
        //   html: emailContent.html,
        // });

        console.log("📧 Email notification (placeholder):", {
            to: body.recipientEmail,
            subject: emailContent.subject,
            type: body.type,
            bookingId: body.booking.id,
        });

        return NextResponse.json({
            success: true,
            message: "Email queued for delivery (placeholder)",
            debug: {
                recipient: body.recipientEmail,
                subject: emailContent.subject,
            },
        });
    } catch (error) {
        console.error("Erro ao processar envio de email:", error);
        return NextResponse.json(
            { error: "Erro interno ao processar solicitação de email" },
            { status: 500 }
        );
    }
}

interface EmailContent {
    subject: string;
    html: string;
    text: string;
}

function generateEmailContent(payload: EmailNotificationPayload): EmailContent {
    const { type, booking, recipientName } = payload;
    const bookingDate = new Date(booking.start_time).toLocaleDateString("pt-BR");
    const startTime = new Date(booking.start_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const endTime = new Date(booking.end_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    switch (type) {
        case "booking_created":
            return {
                subject: `✅ Reserva Confirmada: ${booking.title}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Reserva Confirmada!</h2>
            <p>Olá ${recipientName},</p>
            <p>Sua reserva foi confirmada com sucesso.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📋 Título:</strong> ${booking.title}</p>
              <p><strong>📍 Sala:</strong> ${booking.room_name}</p>
              <p><strong>🏢 Filial:</strong> ${booking.branch_name}</p>
              <p><strong>📅 Data:</strong> ${bookingDate}</p>
              <p><strong>🕐 Horário:</strong> ${startTime} - ${endTime}</p>
            </div>
            <p>Até lá!</p>
          </div>
        `,
                text: `Reserva Confirmada: ${booking.title}\n\nSala: ${booking.room_name}\nData: ${bookingDate}\nHorário: ${startTime} - ${endTime}`,
            };

        case "booking_updated":
            return {
                subject: `📝 Reserva Atualizada: ${booking.title}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Reserva Atualizada</h2>
            <p>Olá ${recipientName},</p>
            <p>Sua reserva foi atualizada.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📋 Título:</strong> ${booking.title}</p>
              <p><strong>📍 Sala:</strong> ${booking.room_name}</p>
              <p><strong>📅 Data:</strong> ${bookingDate}</p>
              <p><strong>🕐 Horário:</strong> ${startTime} - ${endTime}</p>
            </div>
          </div>
        `,
                text: `Reserva Atualizada: ${booking.title}\n\nNovos dados:\nSala: ${booking.room_name}\nData: ${bookingDate}\nHorário: ${startTime} - ${endTime}`,
            };

        case "booking_cancelled":
            return {
                subject: `❌ Reserva Cancelada: ${booking.title}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Reserva Cancelada</h2>
            <p>Olá ${recipientName},</p>
            <p>A seguinte reserva foi cancelada:</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📋 Título:</strong> ${booking.title}</p>
              <p><strong>📍 Sala:</strong> ${booking.room_name}</p>
              <p><strong>📅 Data:</strong> ${bookingDate}</p>
              <p><strong>🕐 Horário:</strong> ${startTime} - ${endTime}</p>
            </div>
          </div>
        `,
                text: `Reserva Cancelada: ${booking.title}\n\nSala: ${booking.room_name}\nData: ${bookingDate}\nHorário: ${startTime} - ${endTime}`,
            };

        case "booking_reminder":
            return {
                subject: `⏰ Lembrete: ${booking.title} começa em breve`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Lembrete de Reunião</h2>
            <p>Olá ${recipientName},</p>
            <p>Sua reunião começa em breve!</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📋 Título:</strong> ${booking.title}</p>
              <p><strong>📍 Sala:</strong> ${booking.room_name}</p>
              <p><strong>🏢 Filial:</strong> ${booking.branch_name}</p>
              <p><strong>🕐 Horário:</strong> ${startTime}</p>
            </div>
          </div>
        `,
                text: `Lembrete: ${booking.title}\n\nSua reunião começa às ${startTime} na sala ${booking.room_name}.`,
            };

        default:
            return {
                subject: `Notificação de Reserva`,
                html: `<p>Você tem uma notificação sobre sua reserva.</p>`,
                text: `Você tem uma notificação sobre sua reserva.`,
            };
    }
}
