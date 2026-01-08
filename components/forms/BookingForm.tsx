"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Branch, Room } from "@/types/supabase";
import { RecurrenceType, BUSINESS_HOURS } from "@/types/booking";
import { createClient } from "@/lib/supabase/client";
import { generateRecurringDates, combineDateAndTime } from "@/lib/utils";

// Schema de validação com Zod
const bookingFormSchema = z
    .object({
        branchId: z.string().min(1, "Selecione uma filial"),
        roomId: z.string().min(1, "Selecione uma sala"),
        title: z
            .string()
            .min(3, "O título deve ter pelo menos 3 caracteres")
            .max(100, "O título deve ter no máximo 100 caracteres"),
        description: z.string().max(500, "A descrição deve ter no máximo 500 caracteres").optional(),
        date: z.date({ required_error: "Selecione uma data" }),
        startTime: z.string().min(1, "Selecione o horário de início"),
        endTime: z.string().min(1, "Selecione o horário de término"),
        recurrence: z.enum(["none", "daily", "weekly"]),
    })
    .refine(
        (data) => {
            const start = parseInt(data.startTime.replace(":", ""));
            const end = parseInt(data.endTime.replace(":", ""));
            return end > start;
        },
        {
            message: "O horário de término deve ser após o horário de início",
            path: ["endTime"],
        }
    );

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
    initialDate?: Date;
    initialTime?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Gera opções de horário
function generateTimeOptions(): { value: string; label: string }[] {
    const options: { value: string; label: string }[] = [];
    for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
        options.push({
            value: `${hour.toString().padStart(2, "0")}:00`,
            label: `${hour.toString().padStart(2, "0")}:00`,
        });
        if (hour < BUSINESS_HOURS.end) {
            options.push({
                value: `${hour.toString().padStart(2, "0")}:30`,
                label: `${hour.toString().padStart(2, "0")}:30`,
            });
        }
    }
    return options;
}

export function BookingForm({
    initialDate,
    initialTime,
    onSuccess,
    onCancel,
}: BookingFormProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const timeOptions = generateTimeOptions();
    const supabase = createClient();

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            branchId: "",
            roomId: "",
            title: "",
            description: "",
            date: initialDate || new Date(),
            startTime: initialTime || "09:00",
            endTime: "10:00",
            recurrence: "none",
        },
    });

    const selectedBranchId = watch("branchId");
    const selectedRecurrence = watch("recurrence");

    // Carrega filiais ao montar o componente
    useEffect(() => {
        async function fetchBranches() {
            const { data, error } = await supabase
                .from("branches")
                .select("*")
                .eq("is_active", true)
                .order("name");

            if (data) {
                setBranches(data);
            }
        }
        fetchBranches();
    }, []);

    // Carrega salas quando uma filial é selecionada
    useEffect(() => {
        async function fetchRooms() {
            if (!selectedBranchId) {
                setRooms([]);
                return;
            }

            const { data, error } = await supabase
                .from("rooms")
                .select("*")
                .eq("branch_id", selectedBranchId)
                .eq("is_active", true)
                .order("name");

            if (data) {
                setRooms(data);
                setValue("roomId", ""); // Reset room selection
            }
        }
        fetchRooms();
    }, [selectedBranchId, setValue]);

    const onSubmit = async (data: BookingFormData) => {
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Obtém o usuário atual
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Você precisa estar autenticado para fazer uma reserva");
            }

            // Combina data e horários
            const startDateTime = combineDateAndTime(data.date, data.startTime);
            const endDateTime = combineDateAndTime(data.date, data.endTime);

            // Se for recorrente, usa a função do banco de dados
            if (data.recurrence !== "none") {
                const { data: bookings, error } = await supabase.rpc(
                    "expand_recurring_booking",
                    {
                        p_room_id: data.roomId,
                        p_user_id: user.id,
                        p_title: data.title,
                        p_description: data.description || null,
                        p_start_time: startDateTime.toISOString(),
                        p_end_time: endDateTime.toISOString(),
                        p_recurrence_type: data.recurrence,
                        p_months_ahead: 3,
                    }
                );

                if (error) {
                    if (error.message.includes("DOUBLE_BOOKING")) {
                        throw new Error(
                            "Conflito de horário: uma ou mais datas já possuem reservas neste horário"
                        );
                    }
                    throw error;
                }

                const count = Array.isArray(bookings) ? bookings.length : 1;
                setSuccessMessage(
                    `✅ ${count} reserva${count > 1 ? "s" : ""} criada${count > 1 ? "s" : ""} com sucesso!`
                );
            } else {
                // Reserva única
                const { error } = await supabase.from("bookings").insert({
                    room_id: data.roomId,
                    user_id: user.id,
                    title: data.title,
                    description: data.description || null,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    is_recurring: false,
                });

                if (error) {
                    if (error.message.includes("DOUBLE_BOOKING")) {
                        throw new Error(
                            "Este horário já está reservado. Por favor, escolha outro horário."
                        );
                    }
                    throw error;
                }

                setSuccessMessage("✅ Reserva criada com sucesso!");
            }

            // Limpa o formulário após sucesso
            reset();
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao criar reserva");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Nova Reserva</CardTitle>
                <CardDescription>
                    Preencha os dados para reservar uma sala de reunião
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {/* Mensagens de erro/sucesso */}
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-600 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {/* Seleção de Filial */}
                    <div className="space-y-2">
                        <Label htmlFor="branch">Filial *</Label>
                        <Controller
                            name="branchId"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma filial" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name} - {branch.location}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.branchId && (
                            <p className="text-sm text-destructive">{errors.branchId.message}</p>
                        )}
                    </div>

                    {/* Seleção de Sala */}
                    <div className="space-y-2">
                        <Label htmlFor="room">Sala *</Label>
                        <Controller
                            name="roomId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={!selectedBranchId || rooms.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                !selectedBranchId
                                                    ? "Selecione uma filial primeiro"
                                                    : rooms.length === 0
                                                        ? "Nenhuma sala disponível"
                                                        : "Selecione uma sala"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name} (Capacidade: {room.capacity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.roomId && (
                            <p className="text-sm text-destructive">{errors.roomId.message}</p>
                        )}
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Título da Reunião *</Label>
                        <Input
                            id="title"
                            placeholder="Ex: Reunião de Planejamento Q1"
                            {...register("title")}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Detalhes adicionais sobre a reunião..."
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Data */}
                    <div className="space-y-2">
                        <Label>Data *</Label>
                        <Controller
                            name="date"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    date={field.value}
                                    onSelect={(date) => field.onChange(date)}
                                    placeholder="Selecione a data"
                                />
                            )}
                        />
                        {errors.date && (
                            <p className="text-sm text-destructive">{errors.date.message}</p>
                        )}
                    </div>

                    {/* Horários */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Início *</Label>
                            <Controller
                                name="startTime"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Início" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Término *</Label>
                            <Controller
                                name="endTime"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Término" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.endTime && (
                                <p className="text-sm text-destructive">{errors.endTime.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Recorrência */}
                    <div className="space-y-3">
                        <Label>Recorrência</Label>
                        <Controller
                            name="recurrence"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Não repetir</SelectItem>
                                        <SelectItem value="daily">Diariamente (3 meses)</SelectItem>
                                        <SelectItem value="weekly">Semanalmente (3 meses)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {selectedRecurrence !== "none" && (
                            <p className="text-xs text-muted-foreground">
                                ⚡ As reservas serão criadas automaticamente para os próximos 3
                                meses
                            </p>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Reservando..." : "Reservar Sala"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
