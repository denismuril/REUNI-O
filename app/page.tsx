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
import { BookingDetailsModal, CalendarEvent } from "@/components/modals/BookingDetailsModal";

type Branch = Database["public"]["Tables"]["branches"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

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
            <div className="hidden lg:flex w-[300px] flex-col border-r bg-muted/40 p-4 gap-6 shrink-0 h-full overflow-y-auto">
                <div className="flex items-center gap-3 px-2">
                    <Image
                        src="/logo-bexp.jpg"
                        alt="BEXP"
                        width={48}
                        height={48}
                        className="rounded-lg"
                    />
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
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                    <SelectTrigger className="w-[180px] sm:w-[250px] md:w-[350px] text-xs sm:text-sm">
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
                            <div className="hidden md:flex items-center gap-2">
                                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                    <SelectTrigger className="w-[140px] md:w-[160px] text-xs sm:text-sm">
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
                {/* Modal de Detalhes / Cancelamento */}
                <BookingDetailsModal
                    event={selectedEvent}
                    isOpen={selectedEvent !== null}
                    onClose={() => setSelectedEvent(null)}
                    onCancelled={fetchBookings}
                />
            </div >
        </div >
    );
}
