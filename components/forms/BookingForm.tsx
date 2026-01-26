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

import { BUSINESS_HOURS } from "@/types/booking";
import { combineDateAndTime } from "@/lib/utils";
import { createBooking, getBranches, getRoomsByBranch } from "@/app/actions/booking";

// Tipos locais para branch e room (vindo das server actions)
type Branch = {
    id: string;
    name: string;
    location: string;
};

type Room = {
    id: string;
    name: string;
    capacity: number;
};

// Schema de validação client-side
const bookingFormSchema = z
    .object({
        branchId: z.string().min(1, "Selecione uma filial"),
        roomId: z.string().min(1, "Selecione uma sala"),
        creatorName: z.string().min(3, "Informe seu nome completo (mínimo 3 letras)"),
        creatorEmail: z.string().email("Informe um e-mail válido"),
        title: z
            .string()
            .min(3, "O título deve ter pelo menos 3 caracteres")
            .max(100, "O título deve ter no máximo 100 caracteres"),
        description: z.string().max(500, "A descrição deve ter no máximo 500 caracteres").optional(),
        date: z.date({ required_error: "Selecione uma data" }),
        startTime: z.string().min(1, "Selecione o horário de início"),
        endTime: z.string().min(1, "Selecione o horário de término"),
        recurrence: z.enum(["none", "daily", "weekly", "monthly", "custom"]),
        recurrenceEndDate: z.date().optional(),
        selectedDaysOfWeek: z.array(z.number()).optional(),
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
    )
    .refine(
        (data) => {
            if (data.recurrence === "custom" && (!data.selectedDaysOfWeek || data.selectedDaysOfWeek.length === 0)) {
                return false;
            }
            return true;
        },
        {
            message: "Selecione pelo menos um dia da semana",
            path: ["selectedDaysOfWeek"],
        }
    )
    .refine(
        (data) => {
            if (data.recurrence !== "none" && !data.recurrenceEndDate) {
                return false;
            }
            return true;
        },
        {
            message: "Selecione a data final da recorrência",
            path: ["recurrenceEndDate"],
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
            creatorName: "",
            creatorEmail: "",
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
    const selectedStartTime = watch("startTime");

    // Carrega filiais ao montar o componente via server action
    useEffect(() => {
        async function fetchBranches() {
            const data = await getBranches();
            setBranches(data as Branch[]);
        }
        fetchBranches();
    }, []);

    // Carrega salas quando uma filial é selecionada via server action
    useEffect(() => {
        async function fetchRooms() {
            if (!selectedBranchId) {
                setRooms([]);
                return;
            }

            const data = await getRoomsByBranch(selectedBranchId);
            setRooms(data as Room[]);
            setValue("roomId", "");
        }
        fetchRooms();
    }, [selectedBranchId, setValue]);

    // Atualiza endTime automaticamente quando startTime muda
    useEffect(() => {
        if (!selectedStartTime) return;

        const [hours, minutes] = selectedStartTime.split(':').map(Number);
        let endHours = hours + 1;

        const formattedEnd = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        setValue("endTime", formattedEnd);
    }, [selectedStartTime, setValue]);

    const onSubmit = async (data: BookingFormData) => {
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const startDateTime = combineDateAndTime(data.date, data.startTime);
            const endDateTime = combineDateAndTime(data.date, data.endTime);

            // Se for custom, garante que selectedDaysOfWeek está preenchido
            const recurrenceDays = data.recurrence === 'custom' ? data.selectedDaysOfWeek : undefined;
            const recurrenceEnd = data.recurrenceEndDate;

            const result = await createBooking({
                roomId: data.roomId,
                creatorName: data.creatorName,
                creatorEmail: data.creatorEmail,
                title: data.title,
                description: data.description,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                isRecurring: data.recurrence !== "none",
                recurrenceType: data.recurrence === "none" ? null : data.recurrence,
                recurrenceEndDate: recurrenceEnd ? recurrenceEnd.toISOString() : undefined,
                selectedDaysOfWeek: recurrenceDays,
            });

            if (!result.success) {
                setError(result.message || "Erro ao criar reserva");
                return;
            }

            setSuccessMessage("✅ Reserva criada com sucesso!");
            reset();
            onSuccess?.();

        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao criar reserva");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-lg max-h-[85vh] flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Nova Reserva</CardTitle>
                <CardDescription className="text-sm">
                    Preencha os dados para reservar uma sala de reunião
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                <CardContent className="space-y-4 overflow-y-auto flex-1 px-4 md:px-6">

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

                    <div className="space-y-2">
                        <Label htmlFor="creatorName">Responsável pela Reserva *</Label>
                        <Input
                            id="creatorName"
                            placeholder="Seu nome completo"
                            disabled={isSubmitting}
                            {...register("creatorName")}
                        />
                        {errors.creatorName && (
                            <p className="text-sm text-destructive">{errors.creatorName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="creatorEmail">Seu E-mail (obrigatório para cancelamento) *</Label>
                        <Input
                            id="creatorEmail"
                            type="email"
                            placeholder="seu.email@exemplo.com"
                            disabled={isSubmitting}
                            {...register("creatorEmail")}
                        />
                        {errors.creatorEmail && (
                            <p className="text-sm text-destructive">{errors.creatorEmail.message}</p>
                        )}
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Título da Reunião *</Label>
                        <Input
                            id="title"
                            placeholder="Ex: Reunião Mensal de Resultados"
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
                    <div className="space-y-4 pt-2 border-t">
                        <div className="space-y-2">
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
                                            <SelectItem value="daily">Diariamente</SelectItem>
                                            <SelectItem value="weekly">Semanalmente</SelectItem>
                                            <SelectItem value="monthly">Mensalmente</SelectItem>
                                            <SelectItem value="custom">Personalizado (Dias da Semana)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {selectedRecurrence !== "none" && (
                            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                <div className="space-y-2">
                                    <Label>Repetir até:</Label>
                                    <Controller
                                        name="recurrenceEndDate"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker
                                                date={field.value}
                                                onSelect={(date) => field.onChange(date)}
                                                placeholder="Selecione a data final"
                                                minDate={new Date()}
                                            />
                                        )}
                                    />
                                    {errors.recurrenceEndDate && (
                                        <p className="text-sm text-destructive">{errors.recurrenceEndDate.message}</p>
                                    )}
                                </div>

                                {selectedRecurrence === "custom" && (
                                    <div className="space-y-2">
                                        <Label>Dias da Semana:</Label>
                                        <Controller
                                            name="selectedDaysOfWeek"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex flex-wrap gap-2">
                                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
                                                        const isSelected = field.value?.includes(index);
                                                        return (
                                                            <Button
                                                                key={index}
                                                                type="button"
                                                                variant={isSelected ? "default" : "outline"}
                                                                size="sm"
                                                                className={`w-10 h-10 p-0 ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                                                                onClick={() => {
                                                                    const current = field.value || [];
                                                                    const updated = current.includes(index)
                                                                        ? current.filter(d => d !== index)
                                                                        : [...current, index];
                                                                    field.onChange(updated);
                                                                }}
                                                            >
                                                                {day}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        />
                                        {errors.selectedDaysOfWeek && (
                                            <p className="text-sm text-destructive">{errors.selectedDaysOfWeek.message}</p>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    ⚡ A reserva principal será criada na data selecionada acima.<br />
                                    As recorrências serão geradas a partir do dia seguinte até a data final.
                                </p>
                            </div>
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
