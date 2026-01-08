"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Calendar, Building2, DoorOpen, LogOut, User } from "lucide-react";

import { WeeklyView, DailyView } from "@/components/calendar";
import { BookingForm } from "@/components/forms";
import { Button } from "@/components/ui/button";
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
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { createClient } from "@/lib/supabase/client";
import { Branch, Room, BookingDetails } from "@/types/supabase";
import { CalendarEvent, CalendarViewType } from "@/types/booking";
import { cn } from "@/lib/utils";

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<CalendarViewType>("weekly");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [selectedRoom, setSelectedRoom] = useState<string>("");
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [initialBookingDate, setInitialBookingDate] = useState<Date>();
    const [initialBookingTime, setInitialBookingTime] = useState<string>();
    const [user, setUser] = useState<{ email: string; name: string } | null>(null);

    const supabase = createClient();

    // Carrega usuário atual
    useEffect(() => {
        async function fetchUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", authUser.id)
                    .single();

                setUser({
                    email: authUser.email || "",
                    name: profile?.full_name || authUser.email || "Usuário",
                });
            }
        }
        fetchUser();
    }, []);

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
                setSelectedRoom(""); // Reset room selection
            }
        }
        fetchRooms();
    }, [selectedBranch]);

    // Carrega bookings
    const fetchBookings = useCallback(async () => {
        setIsLoading(true);

        try {
            let start: Date, end: Date;
            if (viewType === "weekly") {
                start = startOfWeek(currentDate, { weekStartsOn: 1 });
                end = endOfWeek(currentDate, { weekStartsOn: 1 });
            } else {
                start = currentDate;
                end = addDays(currentDate, 1);
            }

            let query = supabase
                .from("booking_details")
                .select("*")
                .gte("start_time", start.toISOString())
                .lt("end_time", end.toISOString())
                .order("start_time");

            // Filtra por filial se selecionada
            if (selectedBranch) {
                query = query.eq("branch_id", selectedBranch);
            }

            // Filtra por sala se selecionada
            if (selectedRoom) {
                query = query.eq("room_id", selectedRoom);
            }

            const { data, error } = await query;

            if (data) {
                // Converte para CalendarEvent
                const calendarEvents: CalendarEvent[] = data.map((booking) => ({
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
    }, [currentDate, viewType, selectedBranch, selectedRoom]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleSlotClick = (date: Date, hour: number, minute: number) => {
        setInitialBookingDate(date);
        setInitialBookingTime(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
        setShowBookingForm(true);
    };

    const handleEventClick = (event: CalendarEvent) => {
        // TODO: Abrir modal de detalhes/edição do evento
        console.log("Event clicked:", event);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                REUNI-O
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Sistema de Reserva de Salas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Filtros */}
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Selecione a filial" />
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

                        <div className="flex items-center gap-2">
                            <DoorOpen className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Todas as salas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todas as salas</SelectItem>
                                    {rooms.map((room) => (
                                        <SelectItem key={room.id} value={room.id}>
                                            {room.name} ({room.capacity}p)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Botão Nova Reserva */}
                        <Popover open={showBookingForm} onOpenChange={setShowBookingForm}>
                            <PopoverTrigger asChild>
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Reserva
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
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

                        {/* User Menu */}
                        {user && (
                            <div className="flex items-center gap-2 pl-4 border-l">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar com informações */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Resumo */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Resumo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Reservas hoje:</span>
                                    <span className="font-medium">
                                        {events.filter(e =>
                                            e.startTime.toDateString() === new Date().toDateString()
                                        ).length}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Esta semana:</span>
                                    <span className="font-medium">{events.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Salas disponíveis:</span>
                                    <span className="font-medium">{rooms.length}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Legenda de cores */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Salas</CardTitle>
                                <CardDescription className="text-xs">
                                    Clique em uma sala para filtrar
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {rooms.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Selecione uma filial para ver as salas
                                    </p>
                                ) : (
                                    rooms.map((room) => (
                                        <button
                                            key={room.id}
                                            onClick={() =>
                                                setSelectedRoom(selectedRoom === room.id ? "" : room.id)
                                            }
                                            className={cn(
                                                "w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors",
                                                selectedRoom === room.id
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            <DoorOpen className="h-4 w-4" />
                                            <div className="flex-1">
                                                <p className="font-medium">{room.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {room.capacity} pessoas
                                                    {room.floor && ` • ${room.floor}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Toggle de visualização */}
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex gap-2">
                                    <Button
                                        variant={viewType === "weekly" ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setViewType("weekly")}
                                    >
                                        Semana
                                    </Button>
                                    <Button
                                        variant={viewType === "daily" ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setViewType("daily")}
                                    >
                                        Dia
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendário */}
                    <div className="lg:col-span-3">
                        <div
                            className="h-[calc(100vh-200px)] min-h-[600px]"
                        >
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
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-4 text-center text-sm text-muted-foreground">
                <p>
                    REUNI-O © {new Date().getFullYear()} • Sistema de Reserva de Salas de
                    Reunião
                </p>
            </footer>
        </div>
    );
}
