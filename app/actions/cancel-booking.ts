"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { clearRateLimit, isRateLimited, recordAttempt } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123");

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestCancellation(bookingId: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const rateLimitKey = `otp_request:${normalizedEmail}`;
    const { limited, resetIn } = isRateLimited(rateLimitKey);

    if (limited) {
        return {
            success: false,
            message: `Muitas tentativas. Aguarde ${resetIn} segundos antes de tentar novamente.`,
        };
    }

    recordAttempt(rateLimitKey);

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, creatorEmail: true, status: true },
        });

        if (!booking) {
            return { success: false, message: "Reserva nao encontrada." };
        }

        if (booking.status === "CANCELLED") {
            return { success: false, message: "Esta reserva ja foi cancelada." };
        }

        if (booking.creatorEmail.toLowerCase().trim() !== normalizedEmail) {
            return { success: false, message: "E-mail nao corresponde a reserva." };
        }

        const token = generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

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

        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    from: "RESERVA <noreply@reuniao.bexp.com.br>",
                    to: normalizedEmail,
                    subject: "Codigo de Cancelamento de Reserva",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2>Cancelamento de Reserva</h2>
                            <p>Voce solicitou o cancelamento de uma reserva.</p>
                            <p>Seu codigo de confirmacao e:</p>
                            <h1 style="background: #f4f4f5; padding: 10px; display: inline-block; letter-spacing: 5px;">${token}</h1>
                            <p>Este codigo expira em 15 minutos.</p>
                            <p style="color: #666; font-size: 12px;">Se nao foi voce, ignore este e-mail.</p>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error("Resend Error:", emailError);
                return { success: false, message: "Erro ao enviar e-mail. Tente novamente." };
            }
        } else {
            console.log("========================================");
            console.log(`[MOCK EMAIL] Para: ${normalizedEmail}`);
            console.log(`[MOCK EMAIL] Token: ${token}`);
            console.log("========================================");
        }

        return { success: true };
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, message: "Erro inesperado ao processar solicitacao." };
    }
}

export async function confirmCancellation(bookingId: string, token: string) {
    try {
        const cancellationToken = await prisma.cancellationToken.findFirst({
            where: {
                bookingId,
                token,
                expiresAt: { gt: new Date() },
            },
            include: {
                booking: {
                    include: {
                        childBookings: {
                            select: { id: true },
                        },
                    },
                },
            },
        });

        if (!cancellationToken) {
            return { success: false, message: "Codigo invalido ou expirado." };
        }

        const booking = cancellationToken.booking;
        const bookingIdsToCancel = booking.parentBookingId
            ? [booking.id]
            : [booking.id, ...booking.childBookings.map((child) => child.id)];

        await prisma.booking.updateMany({
            where: {
                id: { in: bookingIdsToCancel },
            },
            data: {
                status: "CANCELLED",
            },
        });

        await prisma.cancellationToken.deleteMany({
            where: {
                bookingId: { in: bookingIdsToCancel },
            },
        });

        clearRateLimit(`otp_request:${booking.creatorEmail.toLowerCase().trim()}`);

        return { success: true };
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, message: "Erro inesperado ao confirmar." };
    }
}
