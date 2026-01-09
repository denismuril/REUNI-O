"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// Inicializa Resend com chave real ou valor dummy para evitar erro no construtor
const resend = new Resend(process.env.RESEND_API_KEY || "re_123");

export async function requestCancellation(bookingId: string, email: string) {
    const supabase = await createClient();

    try {
        const { data: token, error } = await supabase.rpc('request_cancellation_token', {
            p_booking_id: bookingId,
            p_email: email
        });

        if (error) {
            console.error("RPC Error (request):", error);
            if (error.message.includes("Email") || error.message.includes("inválido")) {
                return { success: false, message: "E-mail não corresponde à reserva." };
            }
            return { success: false, message: "Erro ao gerar código de cancelamento." };
        }

        if (!token) {
            return { success: false, message: "Erro interno: Token não gerado." };
        }

        // Enviar Email se houver chave configurada
        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    from: 'Codigo OTP Cancelamento de Reunião <noreply@bexp.com.br>',
                    to: email,
                    subject: 'Código de Cancelamento de Reserva',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2>Cancelamento de Reserva</h2>
                            <p>Você solicitou o cancelamento de uma reserva.</p>
                            <p>Seu código de confirmação é:</p>
                            <h1 style="background: #f4f4f5; padding: 10px; display: inline-block; letter-spacing: 5px;">${token}</h1>
                            <p>Este código expira em 15 minutos.</p>
                            <p style="color: #666; font-size: 12px;">Se não foi você, ignore este e-mail.</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error("Resend Error:", emailError);
                return { success: false, message: "Erro ao enviar e-mail. Tente novamente." };
            }
        } else {
            // Fallback para desenvolvimento sem chave
            console.log("========================================");
            console.log(`[MOCK EMAIL] Para: ${email}`);
            console.log(`[MOCK EMAIL] Token: ${token}`);
            console.log("========================================");
        }

        return { success: true };

    } catch (e) {
        console.error("Action Error:", e);
        return { success: false, message: "Erro inesperado ao processar solicitação." };
    }
}

export async function confirmCancellation(bookingId: string, token: string) {
    const supabase = await createClient();

    try {
        const { data: success, error } = await supabase.rpc('confirm_cancellation', {
            p_booking_id: bookingId,
            p_token: token
        });

        if (error) {
            console.error("RPC Error (confirm):", error);
            return { success: false, message: "Erro ao confirmar cancelamento." };
        }

        if (!success) {
            return { success: false, message: "Código inválido ou expirado." };
        }

        return { success: true };
    } catch (e) {
        console.error("Action Error:", e);
        return { success: false, message: "Erro inesperado ao confirmar." };
    }
}
