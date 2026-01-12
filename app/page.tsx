"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, subDays, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Users, Building2, DoorOpen, Plus, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { createClient } from "@/lib/supabase/client";
import { Database, BookingDetails } from "@/types/supabase";
import { BookingForm } from "@/components/forms/BookingForm";
import { DailyView } from "@/components/calendar/DailyView";
import { WeeklyView } from "@/components/calendar/WeeklyView";
import { confirmCancellation, requestCancellation } from "./actions/cancel-booking";

type Branch = Database["public"]["Tables"]["branches"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type CalendarEvent = {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    roomId: string;
    roomName: string;
    userId: string | null;
    userName: string;
    userEmail: string;
    creatorName: string | null;
    isRecurring: boolean;
    status: "confirmed" | "cancelled" | "pending";
};

type CalendarViewType = "daily" | "weekly";
function DailyEventList({ events, currentDate }: { events: CalendarEvent[]; currentDate: Date }) {
    const dailyEvents = events.filter(e => isSameDay(e.startTime, currentDate));

    if (dailyEvents.length === 0) {
        return <div className="text-sm text-muted-foreground italic p-2 text-center border border-dashed rounded-md">Nenhuma reunião para este dia.</div>;
    }

    return (
        <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1">
            {dailyEvents.map(event => (
                <div key={event.id} className="text-sm border-l-4 border-primary pl-3 py-2 bg-accent/20 rounded-r-md hover:bg-accent/40 transition-colors">
                    <div className="font-semibold truncate text-foreground">{event.title}</div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-mono bg-background px-1 rounded border">
                            {format(event.startTime, "HH:mm")} - {format(event.endTime, "HH:mm")}
                        </span>
                    </div>

                    <div className="flex flex-col mt-1.5 gap-0.5">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <DoorOpen className="h-3 w-3" />
                            <span className="truncate">{event.roomName}</span>
                        </div>
                        {event.creatorName && (
                            <div className="text-xs text-primary font-medium flex items-center gap-1">
                                <span className="opacity-70">Resp:</span>
                                <span className="truncate">{event.creatorName}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<CalendarViewType>("weekly");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [selectedRoom, setSelectedRoom] = useState<string>("all");
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBranchesLoaded, setIsBranchesLoaded] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [initialBookingDate, setInitialBookingDate] = useState<Date>();
    const [initialBookingTime, setInitialBookingTime] = useState<string>();

    // Estados Cancelamento
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelStep, setCancelStep] = useState<"email" | "otp">("email");
    const [cancelEmail, setCancelEmail] = useState("");
    const [cancelToken, setCancelToken] = useState("");
    const [cancelError, setCancelError] = useState("");
    const [isProcessingCancel, setIsProcessingCancel] = useState(false);

    const supabase = createClient();

    // Carrega filiais
    useEffect(() => {
        async function fetchBranches() {
            const { data } = await supabase
                .from("branches")
                .select("*")
                .eq("is_active", true)
                .order("name");

            if (data) {
                setBranches(data);
                if (data.length > 0 && !selectedBranch) {
                    setSelectedBranch(data[0].id);
                }
                setIsBranchesLoaded(true);
            }
        }
        fetchBranches();
    }, []);

    // Carrega salas quando filial muda
    useEffect(() => {
        async function fetchRooms() {
            if (!selectedBranch) {
                setRooms([]);
                return;
            }

            const { data } = await supabase
                .from("rooms")
                .select("*")
                .eq("branch_id", selectedBranch)
                .eq("is_active", true)
                .order("name");

            if (data) {
                setRooms(data);
                setSelectedRoom("all");
            }
        }
        fetchRooms();
    }, [selectedBranch]);
    // Carrega bookings
    const fetchBookings = useCallback(async () => {
        if (!isBranchesLoaded) return;

        setIsLoading(true);

        try {
            let start: Date, end: Date;
            if (viewType === "weekly") {
                // Pega a semana inteira + margem de segurança para timezone
                start = subDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 1);
                end = addDays(endOfWeek(currentDate, { weekStartsOn: 1 }), 1);
            } else {
                start = subDays(currentDate, 1);
                end = addDays(currentDate, 2);
            }

            let query = supabase
                .from("booking_details")
                .select("*")
                .gte("start_time", start.toISOString())
                .lt("end_time", end.toISOString())
                .order("start_time");

            if (selectedBranch) {
                query = query.eq("branch_id", selectedBranch);
            }

            if (selectedRoom && selectedRoom !== "all") {
                query = query.eq("room_id", selectedRoom);
            }

            const { data, error } = await query;

            if (data) {
                const calendarEvents: CalendarEvent[] = data.map((booking: BookingDetails) => ({
                    id: booking.id,
                    title: booking.title,
                    description: booking.description,
                    startTime: new Date(booking.start_time),
                    endTime: new Date(booking.end_time),
                    roomId: booking.room_id,
                    roomName: booking.room_name,
                    userId: booking.user_id,
                    userName: booking.user_name,
                    userEmail: booking.user_email,
                    creatorName: booking.creator_name, // Mapeado novo campo
                    isRecurring: booking.is_recurring,
                    status: booking.status as "confirmed" | "cancelled" | "pending",
                }));

                setEvents(calendarEvents);
            }
        } catch (error) {
            console.error("Erro ao carregar reservas:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, viewType, selectedBranch, selectedRoom, supabase, isBranchesLoaded]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsCancelling(false); // Resetar ao abrir
        setCancelEmail("");
        setCancelError("");
    };

    const handleStartCancellation = () => {
        setIsCancelling(true);
        setCancelStep("email");
        setCancelError("");
    };

    const handleRequestToken = async () => {
        if (!selectedEvent) return;
        if (!cancelEmail) { setCancelError("Digite o email usado na reserva."); return; }

        setIsProcessingCancel(true);
        setCancelError("");

        const res = await requestCancellation(selectedEvent.id, cancelEmail);
        setIsProcessingCancel(false);

        if (res.success) {
            setCancelStep("otp");
            setCancelError("");
        } else {
            setCancelError(res.message || "Erro ao solicitar código.");
        }
    };

    const handleConfirmCancellation = async () => {
        if (!selectedEvent) return;
        if (!cancelToken) { setCancelError("Digite o código recebido."); return; }

        setIsProcessingCancel(true);
        setCancelError("");

        const res = await confirmCancellation(selectedEvent.id, cancelToken);
        setIsProcessingCancel(false);

        if (res.success) {
            setSelectedEvent(null);
            setIsCancelling(false);
            fetchBookings();
            // Idealmente exibir um Toast de sucesso, mas vamos fechar por enquanto
        } else {
            setCancelError(res.message || "Código inválido.");
        }
    };

    const handleSlotClick = (date: Date) => {
        setInitialBookingDate(date);

        // Formata hora para string HH:00 ou HH:30
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        setInitialBookingTime(`${hours}:${minutes}`);

        setShowBookingForm(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };
    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Sidebar Desktop */}
            <div className="hidden lg:flex w-[300px] flex-col border-r bg-muted/40 p-4 gap-6 shrink-0 h-full overflow-y-auto">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex flex-col justify-center border-l pl-4 h-10 border-border/50">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Salas de</span>
                        <span className="text-sm font-bold uppercase tracking-widest text-foreground leading-tight">Reunião</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
                    {/* Mini Calendário */}
                    <div className="space-y-2 shrink-0">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Navegação</Label>
                        <div className="rounded-md border bg-background shadow-sm">
                            <Calendar
                                mode="single"
                                selected={currentDate}
                                onSelect={(date) => date && setCurrentDate(date)}
                                initialFocus
                                locale={ptBR}
                                className="p-3"
                            />
                        </div>
                    </div>

                    {/* Lista Eventos Dia */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 shrink-0">
                            Agenda do Dia ({format(currentDate, "dd/MM", { locale: ptBR })})
                        </Label>
                        <DailyEventList events={events} currentDate={currentDate} />
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t">
                    <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                        Sair do Sistema
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Header */}
                <header className="h-14 border-b bg-background/95 backdrop-blur px-4 flex items-center justify-between shrink-0 z-10 sticky top-0">
                    <div className="flex items-center w-full gap-4">
                        {/* Mobile & Logo */}
                        <div className="lg:hidden flex items-center gap-2 font-bold italic text-xl mr-auto">
                            BEXP
                        </div>
                        {/* Filtros e Controles */}
                        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">

                            {/* Seletor de Filial */}
                            <div className="hidden sm:flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                    <SelectTrigger className="w-[300px] md:w-[450px]">
                                        <SelectValue placeholder="Filial" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Seletor de Sala */}
                            <div className="hidden sm:flex items-center gap-2">
                                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                    <SelectTrigger className="w-[140px] md:w-[180px]">
                                        <SelectValue placeholder="Todas as salas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as salas</SelectItem>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-6 w-px bg-border hidden sm:block" />

                            {/* View Toggle */}
                            <div className="flex items-center bg-muted rounded-md p-1">
                                <Button
                                    variant={viewType === "weekly" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewType("weekly")}
                                    className="h-7 text-xs px-3"
                                >
                                    Semana
                                </Button>
                                <Button
                                    variant={viewType === "daily" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewType("daily")}
                                    className="h-7 text-xs px-3"
                                >
                                    Dia
                                </Button>
                            </div>

                            {/* Botão Nova Reserva */}
                            <Popover open={showBookingForm} onOpenChange={setShowBookingForm}>
                                <PopoverTrigger asChild>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nova Reserva
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
                                    <BookingForm
                                        initialDate={initialBookingDate}
                                        initialTime={initialBookingTime}
                                        onSuccess={() => {
                                            setShowBookingForm(false);
                                            fetchBookings();
                                        }}
                                        onCancel={() => setShowBookingForm(false)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </header>

                {/* Área do Calendário */}
                <main className="flex-1 overflow-hidden p-4 bg-muted/10">
                    <div className="h-full bg-background rounded-lg border shadow-sm overflow-hidden flex flex-col">
                        {viewType === "weekly" ? (
                            <WeeklyView
                                currentDate={currentDate}
                                events={events}
                                onDateChange={setCurrentDate}
                                onEventClick={handleEventClick}
                                onSlotClick={handleSlotClick}
                                isLoading={isLoading}
                            />
                        ) : (
                            <DailyView
                                currentDate={currentDate}
                                events={events}
                                onDateChange={setCurrentDate}
                                onEventClick={handleEventClick}
                                onSlotClick={handleSlotClick}
                                onViewChange={() => setViewType("weekly")}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="shrink-0 border-t py-2 px-4 bg-background text-center text-xs text-muted-foreground flex items-center justify-between">
                    <span>BEXP SALAS DE REUNIÃO © {new Date().getFullYear()}</span>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline">Sistema de Gestão de Espaços</span>
                        {/* Admin Link discreto */}
                        <a href="/admin" className="hover:text-primary transition-colors">Admin</a>
                    </div>
                </footer>
                {/* Modal de Detalhes / Cancelamento (Movido para root level) */}
                {
                    selectedEvent && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                            <div className="bg-card border rounded-lg shadow-lg w-full max-w-md p-6 relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-4"
                                    onClick={() => setSelectedEvent(null)}
                                >
                                    <span className="sr-only">Fechar</span>
                                    <Plus className="h-4 w-4 rotate-45" />
                                </Button>

                                {!isCancelling ? (
                                    // STEP 0: Detalhes
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                                            <p className="text-sm text-muted-foreground">{selectedEvent.roomName}</p>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b">
                                                <span className="text-muted-foreground">Data:</span>
                                                <span className="font-medium">
                                                    {format(selectedEvent.startTime, "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                                <span className="text-muted-foreground">Horário:</span>
                                                <span className="font-medium">
                                                    {format(selectedEvent.startTime, "HH:mm")} - {format(selectedEvent.endTime, "HH:mm")}
                                                </span>
                                            </div>
                                            {selectedEvent.description && (
                                                <div className="py-1 border-b">
                                                    <span className="text-muted-foreground block mb-1">Descrição:</span>
                                                    <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                                                </div>
                                            )}
                                            <div className="py-1">
                                                <span className="text-muted-foreground block mb-1">Responsável:</span>
                                                <span className="font-medium uppercase">{selectedEvent.creatorName || selectedEvent.userName || "Anônimo"}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                                                Fechar
                                            </Button>
                                            <Button variant="destructive" onClick={handleStartCancellation}>
                                                Cancelar Reserva
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-destructive">Cancelar Reserva</h3>

                                        {cancelStep === 'email' ? (
                                            <div className="space-y-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Para segurança, confirme o e-mail utilizado na reserva. Enviaremos um código de validação.
                                                </p>
                                                <div className="space-y-2">
                                                    <Label>Seu E-mail</Label>
                                                    <Input
                                                        type="email"
                                                        placeholder="ex: nome@empresa.com"
                                                        value={cancelEmail}
                                                        onChange={(e) => setCancelEmail(e.target.value)}
                                                    />
                                                </div>
                                                {cancelError && <p className="text-xs text-destructive font-medium">{cancelError}</p>}
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button variant="ghost" onClick={() => setIsCancelling(false)}>Voltar</Button>
                                                    <Button
                                                        onClick={handleRequestToken}
                                                        disabled={isProcessingCancel || !cancelEmail}
                                                    >
                                                        {isProcessingCancel ? "Enviando..." : "Enviar Código"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Insira o código enviado para <strong>{cancelEmail}</strong>.
                                                </p>
                                                <div className="space-y-2">
                                                    <Label>Código de Validação</Label>
                                                    <Input
                                                        placeholder="000000"
                                                        value={cancelToken}
                                                        onChange={(e) => setCancelToken(e.target.value)}
                                                        maxLength={6}
                                                    />
                                                </div>
                                                {cancelError && <p className="text-xs text-destructive font-medium">{cancelError}</p>}
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button variant="ghost" onClick={() => setCancelStep('email')}>Voltar</Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleConfirmCancellation}
                                                        disabled={isProcessingCancel || !cancelToken}
                                                    >
                                                        {isProcessingCancel ? "Cancelando..." : "Confirmar Cancelamento"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
