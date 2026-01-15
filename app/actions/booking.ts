"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "./email-actions";
import { BookingInsert } from "@/types/supabase";

// Schema de validação server-side com Zod
// A validação de domínio é feita aqui no servidor para segurança
const bookingSchema = z.object({
    roomId: z.string().uuid("ID da sala inválido"),
    creatorName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    creatorEmail: z
        .string()
        .email("E-mail inválido")
        .transform((email) => email.toLowerCase().trim())
        .refine(
            (email) => {
                // Usa variável de ambiente do servidor (não exposta ao cliente)
                const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
                if (!allowedDomain) return true; // Se não configurado, permite qualquer domínio
                return email.endsWith(`@${allowedDomain.toLowerCase()}`);
            },
            {
                message: `Apenas e-mails corporativos são permitidos`,
            }
        ),
    title: z
        .string()
        .min(3, "Título deve ter pelo menos 3 caracteres")
        .max(100, "Título deve ter no máximo 100 caracteres"),
    description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
    startTime: z.string().datetime("Data/hora de início inválida"),
    endTime: z.string().datetime("Data/hora de término inválida"),
    isRecurring: z.boolean().optional().default(false),
    recurrenceType: z.enum(["daily", "weekly"]).optional().nullable(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingResult = {
    success: boolean;
    message?: string;
    bookingId?: string;
};

/**
 * Server Action para criar uma reserva
 * Executa no servidor com privilégios adequados, permitindo reservas de visitantes
 */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
    // 1. Validar dados com Zod
    const parseResult = bookingSchema.safeParse(input);

    if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return {
            success: false,
            message: firstError?.message || "Dados inválidos",
        };
    }

    const data = parseResult.data;

    // 2. Validações adicionais de negócio
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const now = new Date();

    // Não permitir reservas no passado
    if (startDateTime < now) {
        return {
            success: false,
            message: "Não é possível criar reservas no passado.",
        };
    }

    // Término deve ser após início
    if (endDateTime <= startDateTime) {
        return {
            success: false,
            message: "O horário de término deve ser após o horário de início.",
        };
    }

    // Duração máxima de 8 horas (validado também no banco)
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
        return {
            success: false,
            message: "A duração máxima de uma reserva é 8 horas.",
        };
    }

    // 3. Inserir no banco de dados via Supabase server client
    const supabase = await createClient();

    try {
        // Preparar dados para inserção com tipo explícito
        const bookingData: BookingInsert = {
            room_id: data.roomId,
            user_id: null, // Reserva anônima (visitante)
            creator_name: data.creatorName,
            creator_email: data.creatorEmail,
            title: data.title,
            description: data.description || null,
            start_time: data.startTime,
            end_time: data.endTime,
            is_recurring: data.isRecurring || false,
            recurrence_type: data.recurrenceType || null,
            status: "confirmed",
        };

        const { data: insertedBooking, error } = await supabase
            .from("bookings")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(bookingData as any)
            .select("id")
            .single();

        if (error) {
            console.error("Supabase insert error:", error);

            // Verificar erro de double booking
            if (error.message?.includes("DOUBLE_BOOKING")) {
                return {
                    success: false,
                    message: "Este horário já está reservado. Por favor, escolha outro horário.",
                };
            }

            return {
                success: false,
                message: "Erro ao criar reserva. Tente novamente.",
            };
        }

        // Extrair o ID de forma segura
        const bookingId = (insertedBooking as { id: string } | null)?.id;

        if (!bookingId) {
            return {
                success: false,
                message: "Erro ao criar reserva: ID não retornado.",
            };
        }

        // 4. Buscar nome da sala para o e-mail
        const { data: roomData } = await supabase
            .from("rooms")
            .select("name")
            .eq("id", data.roomId)
            .single();

        const roomName = (roomData as { name: string } | null)?.name || "Sala de Reunião";

        // 5. Enviar e-mail de confirmação em background (não bloqueia)
        sendBookingConfirmationEmail({
            to: data.creatorEmail,
            bookingId: bookingId,
            title: data.title,
            roomName: roomName,
            startTime: data.startTime,
            endTime: data.endTime,
            creatorName: data.creatorName,
        }).catch((err) => {
            console.error("Falha ao enviar email de confirmação:", err);
        });

        return {
            success: true,
            bookingId: bookingId,
            message: "Reserva criada com sucesso!",
        };
    } catch (err) {
        console.error("Unexpected error creating booking:", err);
        return {
            success: false,
            message: "Erro inesperado ao criar reserva.",
        };
    }
}
