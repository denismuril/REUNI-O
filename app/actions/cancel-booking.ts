"use server";

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";

// Inicializa Resend
const resend = new Resend(process.env.RESEND_API_KEY || "re_123");

/**
 * Gera um token OTP de 6 dígitos
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Solicita cancelamento de uma reserva (gera e envia OTP)
 */
export async function requestCancellation(bookingId: string, email: string) {
    // Verificar rate limiting (3 tentativas por email em 15 minutos)
    const rateLimitKey = `otp_request:${email.toLowerCase()}`;
    const { limited, resetIn } = isRateLimited(rateLimitKey);

    if (limited) {
        return {
            success: false,
            message: `Muitas tentativas. Aguarde ${resetIn} segundos antes de tentar novamente.`,
        };
    }

    recordAttempt(rateLimitKey);

    try {
        // Verificar se a reserva existe e pertence ao email
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, creatorEmail: true },
        });

        if (!booking) {
            return { success: false, message: "Reserva não encontrada." };
        }

        // Normalizar e comparar emails
        if (booking.creatorEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
            return { success: false, message: "E-mail não corresponde à reserva." };
        }

        // Gerar OTP
        const token = generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Limpar tokens antigos e criar novo
        await prisma.cancellationToken.deleteMany({
            where: { bookingId },
        });

        await prisma.cancellationToken.create({
            data: {
                bookingId,
                token,
                expiresAt,
            },
        });

        // Enviar Email
        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    from: 'RESERVA <noreply@reuniao.bexp.com.br>',
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
            // Fallback para desenvolvimento
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

/**
 * Confirma o cancelamento de uma reserva com o OTP
 */
export async function confirmCancellation(bookingId: string, token: string) {
    try {
        // Verificar token
        const cancellationToken = await prisma.cancellationToken.findFirst({
            where: {
                bookingId,
                token,
                expiresAt: { gt: new Date() },
            },
        });

        if (!cancellationToken) {
            return { success: false, message: "Código inválido ou expirado." };
        }

        // Deletar a reserva (cascade deleta o token)
        await prisma.booking.delete({
            where: { id: bookingId },
        });

        return { success: true };
    } catch (e) {
        console.error("Action Error:", e);
        return { success: false, message: "Erro inesperado ao confirmar." };
    }
}
