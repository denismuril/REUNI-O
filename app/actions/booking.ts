"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "./email-actions";

const bookingSchema = z.object({
    roomId: z.string().uuid("ID da sala invalido"),
    creatorName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    creatorEmail: z
        .string()
        .email("E-mail invalido")
        .transform((email) => email.toLowerCase().trim())
        .refine(
            (email) => {
                const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
                if (!allowedDomain) return true;
                return email.endsWith(`@${allowedDomain.toLowerCase()}`);
            },
            {
                message: "Apenas e-mails corporativos sao permitidos",
            }
        ),
    title: z
        .string()
        .min(3, "Titulo deve ter pelo menos 3 caracteres")
        .max(100, "Titulo deve ter no maximo 100 caracteres"),
    description: z.string().max(500, "Descricao deve ter no maximo 500 caracteres").optional(),
    startTime: z.string().datetime("Data/hora de inicio invalida"),
    endTime: z.string().datetime("Data/hora de termino invalida"),
    isRecurring: z.boolean().optional().default(false),
    recurrenceType: z.enum(["daily", "weekly", "monthly", "custom"]).optional().nullable(),
    recurrenceEndDate: z.string().datetime().optional().nullable(),
    selectedDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    monthlyPattern: z.enum(["same_day", "same_weekday"]).optional().nullable(),
    weeklyDayOfWeek: z.number().min(0).max(6).optional().nullable(),
    monthlyDay: z.number().min(1).max(31).optional().nullable(),
    monthlyWeekdayOccurrence: z.number().min(1).max(5).optional().nullable(),
    monthlyWeekdayNumber: z.number().min(0).max(6).optional().nullable(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingResult = {
    success: boolean;
    message?: string;
    bookingId?: string;
};

type CountBookings = (
    args: Parameters<typeof prisma.booking.count>[0]
) => ReturnType<typeof prisma.booking.count>;

async function checkAvailability(
    countBookings: CountBookings,
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
): Promise<boolean> {
    const conflictCount = await countBookings({
        where: {
            roomId,
            status: "CONFIRMED",
            id: excludeBookingId ? { not: excludeBookingId } : undefined,
            AND: [
                { startTime: { lt: endTime } },
                { endTime: { gt: startTime } },
            ],
        },
    });

    return conflictCount === 0;
}

function buildRecurringOccurrences(
    recurringDates: Date[],
    startDateTime: Date,
    durationMs: number
) {
    return recurringDates.map((date) => {
        const occurrenceStart = new Date(date);
        occurrenceStart.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);

        return {
            startTime: occurrenceStart,
            endTime: new Date(occurrenceStart.getTime() + durationMs),
        };
    });
}

async function createBookingWithRetry(
    data: BookingInput,
    startDateTime: Date,
    endDateTime: Date,
    recurringDates: Date[]
) {
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const recurringOccurrences = buildRecurringOccurrences(recurringDates, startDateTime, durationMs);

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await prisma.$transaction(
                async (tx) => {
                    const countBookings = tx.booking.count.bind(tx.booking) as CountBookings;

                    const isAvailable = await checkAvailability(
                        countBookings,
                        data.roomId,
                        startDateTime,
                        endDateTime
                    );

                    if (!isAvailable) {
                        throw new Error("Este horario ja esta reservado. Por favor, escolha outro horario.");
                    }

                    for (const occurrence of recurringOccurrences) {
                        const isOccurrenceAvailable = await checkAvailability(
                            countBookings,
                            data.roomId,
                            occurrence.startTime,
                            occurrence.endTime
                        );

                        if (!isOccurrenceAvailable) {
                            throw new Error(
                                `Conflito de horario na recorrencia em ${occurrence.startTime.toLocaleDateString("pt-BR")}.`
                            );
                        }
                    }

                    const booking = await tx.booking.create({
                        data: {
                            roomId: data.roomId,
                            userId: null,
                            creatorName: data.creatorName,
                            creatorEmail: data.creatorEmail,
                            title: data.title,
                            description: data.description || null,
                            startTime: startDateTime,
                            endTime: endDateTime,
                            isRecurring: data.isRecurring || false,
                            recurrenceType: data.recurrenceType || null,
                            status: "CONFIRMED",
                        },
                        include: {
                            room: {
                                select: { name: true },
                            },
                        },
                    });

                    if (recurringOccurrences.length > 0) {
                        await tx.booking.createMany({
                            data: recurringOccurrences.map((occurrence) => ({
                                roomId: data.roomId,
                                userId: null,
                                creatorName: data.creatorName,
                                creatorEmail: data.creatorEmail,
                                title: data.title,
                                description: data.description || null,
                                startTime: occurrence.startTime,
                                endTime: occurrence.endTime,
                                isRecurring: true,
                                recurrenceType: data.recurrenceType || null,
                                parentBookingId: booking.id,
                                status: "CONFIRMED",
                            })),
                        });
                    }

                    return booking;
                },
                {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                }
            );
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2034" &&
                attempt === 0
            ) {
                continue;
            }

            throw error;
        }
    }

    throw new Error("Nao foi possivel confirmar a disponibilidade da sala.");
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
    const parseResult = bookingSchema.safeParse(input);

    if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return {
            success: false,
            message: firstError?.message || "Dados invalidos",
        };
    }

    const data = parseResult.data;
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const now = new Date();

    if (startDateTime < now) {
        return {
            success: false,
            message: "Nao e possivel criar reservas no passado.",
        };
    }

    if (endDateTime <= startDateTime) {
        return {
            success: false,
            message: "O horario de termino deve ser apos o horario de inicio.",
        };
    }

    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
        return {
            success: false,
            message: "A duracao maxima de uma reserva e 8 horas.",
        };
    }

    if (data.recurrenceEndDate && new Date(data.recurrenceEndDate) < startDateTime) {
        return {
            success: false,
            message: "A data final da recorrencia deve ser posterior ao inicio da reserva.",
        };
    }

    let recurringDates: Date[] = [];
    if (data.isRecurring && data.recurrenceType) {
        const { generateRecurringDates } = await import("@/lib/utils");

        recurringDates = generateRecurringDates(
            startDateTime,
            data.recurrenceType,
            {
                endDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : undefined,
                daysOfWeek: data.selectedDaysOfWeek,
                monthlyPattern: data.monthlyPattern || undefined,
                weeklyDayOfWeek: data.weeklyDayOfWeek ?? undefined,
                monthlyDay: data.monthlyDay ?? undefined,
                monthlyWeekdayOccurrence: data.monthlyWeekdayOccurrence ?? undefined,
                monthlyWeekdayNumber: data.monthlyWeekdayNumber ?? undefined,
            }
        );

        if (recurringDates.length > 50) {
            return {
                success: false,
                message: "O periodo selecionado gera muitas ocorrencias (limite: 50). Reduza o intervalo.",
            };
        }
    }

    try {
        const booking = await createBookingWithRetry(data, startDateTime, endDateTime, recurringDates);

        sendBookingConfirmationEmail({
            to: data.creatorEmail,
            bookingId: booking.id,
            title: data.title,
            roomName: booking.room.name,
            startTime: data.startTime,
            endTime: data.endTime,
            creatorName: data.creatorName,
        }).catch((error) => {
            console.error("Falha ao enviar email de confirmacao:", error);
        });

        return {
            success: true,
            bookingId: booking.id,
            message: recurringDates.length > 0
                ? `Reserva criada com sucesso! (+${recurringDates.length} recorrencias)`
                : "Reserva criada com sucesso!",
        };
    } catch (error) {
        console.error("Unexpected error creating booking:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Erro inesperado ao criar reserva.",
        };
    }
}

export async function getBookingsForCalendar(
    startDate: Date,
    endDate: Date,
    branchId?: string,
    roomId?: string
) {
    const bookings = await prisma.booking.findMany({
        where: {
            startTime: { gte: startDate },
            endTime: { lt: endDate },
            status: { not: "CANCELLED" },
            room: branchId ? { branchId } : undefined,
            roomId: roomId && roomId !== "all" ? roomId : undefined,
        },
        include: {
            room: {
                include: {
                    branch: true,
                },
            },
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
        orderBy: { startTime: "asc" },
    });

    return bookings.map((booking) => ({
        id: booking.id,
        title: booking.title,
        description: booking.description,
        start_time: booking.startTime.toISOString(),
        end_time: booking.endTime.toISOString(),
        status: booking.status.toLowerCase(),
        is_recurring: booking.isRecurring,
        room_id: booking.roomId,
        room_name: booking.room.name,
        room_capacity: booking.room.capacity,
        branch_id: booking.room.branchId,
        branch_name: booking.room.branch.name,
        branch_timezone: booking.room.branch.timezone,
        user_id: booking.userId,
        user_name: booking.user?.fullName || null,
        user_email: booking.user?.email || null,
        creator_name: booking.creatorName,
        creator_email: booking.creatorEmail,
    }));
}

export async function getBranches() {
    return prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });
}

export async function getRoomsByBranch(branchId: string) {
    return prisma.room.findMany({
        where: {
            branchId,
            isActive: true,
        },
        orderBy: { name: "asc" },
    });
}
