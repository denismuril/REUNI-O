"use server";

import { Resend } from "resend";
import {
    getBookingConfirmationTemplate,
    getBookingCancellationTemplate,
    getBookingReminderTemplate
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendBookingEmailProps {
    to: string;
    bookingId: string;
    title: string;
    roomName: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    creatorName: string;
}

/**
 * Envia email de confirmação de reserva
 */
export async function sendBookingConfirmationEmail(data: SendBookingEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("[Email] RESEND_API_KEY não configurada. Email não enviado.");
        return { success: false, error: "Serviço de email não configurado" };
    }

    try {
        const startDate = new Date(data.startTime);
        const endDate = new Date(data.endTime);

        const dateFormatted = startDate.toLocaleDateString("pt-BR", {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        const timeStartFormatted = startDate.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
        const timeEndFormatted = endDate.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

        const html = getBookingConfirmationTemplate({
            title: data.title,
            roomName: data.roomName,
            date: dateFormatted,
            startTime: timeStartFormatted,
            endTime: timeEndFormatted,
            creatorName: data.creatorName,
            bookingId: data.bookingId
        });

        const { data: emailData, error } = await resend.emails.send({
            from: 'RESERVA <noreply@reuniao.bexp.com.br>',
            to: data.to,
            subject: `Confirmação de Reserva: ${data.title}`,
            html: html,
        });

        if (error) {
            console.error("[Email] Erro Resend:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: emailData?.id };
    } catch (error) {
        console.error("[Email] Erro exceção:", error);
        return { success: false, error: "Erro interno ao enviar email" };
    }
}

/**
 * Envia email de cancelamento (pode ser usado por admin ou pelo próprio usuário)
 */
export async function sendBookingCancellationEmail(data: SendBookingEmailProps) {
    if (!process.env.RESEND_API_KEY) return { success: false };

    try {
        const startDate = new Date(data.startTime);
        const dateFormatted = startDate.toLocaleDateString("pt-BR", {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });

        const html = getBookingCancellationTemplate({
            title: data.title,
            roomName: data.roomName,
            date: dateFormatted,
            startTime: "", // Não necessário para cancelamento
            endTime: "",
            creatorName: data.creatorName,
        });

        await resend.emails.send({
            from: 'RESERVA <noreply@reuniao.bexp.com.br>',
            to: data.to,
            subject: `Cancelamento: ${data.title}`,
            html: html,
        });

        return { success: true };
    } catch (error) {
        console.error("[Email] Erro ao enviar cancelamento:", error);
        return { success: false };
    }
}
