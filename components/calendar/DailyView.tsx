"use client";

import React, { useMemo } from "react";
import { format, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
    CalendarEvent,
    generateTimeSlots,
    WEEKDAYS,
} from "@/types/booking";
import { EventBlock } from "./EventBlock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DailyViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onDateChange: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onSlotClick?: (date: Date, hour: number, minute: number) => void;
    onViewChange?: () => void;
    isLoading?: boolean;
}

const SLOT_HEIGHT = 48; // pixels por slot de 30 minutos (maior para visualização diária)
const TIME_COLUMN_WIDTH = 70;

export function DailyView({
    currentDate,
    events,
    onDateChange,
    onEventClick,
    onSlotClick,
    onViewChange,
    isLoading = false,
}: DailyViewProps) {
    // Gera os time slots
    const timeSlots = useMemo(() => generateTimeSlots(), []);

    // Filtra eventos do dia atual
    const dayEvents = useMemo(() => {
        return events.filter((event) => {
            const eventDate = new Date(event.startTime);
            return (
                eventDate.getDate() === currentDate.getDate() &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
            );
        });
    }, [events, currentDate]);

    const goToPreviousDay = () => {
        onDateChange(addDays(currentDate, -1));
    };

    const goToNextDay = () => {
        onDateChange(addDays(currentDate, 1));
    };

    const goToToday = () => {
        onDateChange(new Date());
    };

    const dayOfWeek = WEEKDAYS[currentDate.getDay()];

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border shadow-sm">
            {/* Header com navegação */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextDay}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Hoje
                    </Button>
                    {onViewChange && (
                        <Button variant="outline" size="sm" onClick={onViewChange}>
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Semana
                        </Button>
                    )}
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-semibold">
                        {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h2>
                    {isToday(currentDate) && (
                        <span className="text-xs text-primary font-medium">Hoje</span>
                    )}
                </div>
                <div className="w-40" /> {/* Spacer para centralizar o título */}
            </div>

            {/* Resumo de eventos do dia */}
            <div className="px-4 py-2 border-b bg-muted/10">
                <p className="text-sm text-muted-foreground">
                    {dayEvents.length === 0
                        ? "Nenhuma reserva para este dia"
                        : `${dayEvents.length} reserva${dayEvents.length > 1 ? "s" : ""} para ${dayOfWeek}`}
                </p>
            </div>

            {/* Grid do calendário */}
            <div className="flex-1 overflow-auto">
                <div className="flex min-h-full">
                    {/* Coluna de horários */}
                    <div
                        className="flex-shrink-0 border-r bg-muted/10"
                        style={{ width: TIME_COLUMN_WIDTH }}
                    >
                        {timeSlots.map((slot) => (
                            <div
                                key={slot.label}
                                className={cn(
                                    "text-sm text-muted-foreground text-right pr-3 border-b flex items-center justify-end",
                                    slot.minute === 0 && "font-medium text-foreground"
                                )}
                                style={{ height: SLOT_HEIGHT }}
                            >
                                {slot.minute === 0 && slot.label}
                            </div>
                        ))}
                    </div>

                    {/* Área principal do dia */}
                    <div
                        className={cn(
                            "flex-1 relative",
                            isToday(currentDate) && "bg-primary/5"
                        )}
                    >
                        {/* Linhas de fundo para cada slot */}
                        {timeSlots.map((slot) => (
                            <div
                                key={slot.label}
                                className={cn(
                                    "border-b hover:bg-accent/30 cursor-pointer transition-colors",
                                    slot.minute === 0 && "border-b-muted-foreground/30"
                                )}
                                style={{ height: SLOT_HEIGHT }}
                                onClick={() =>
                                    onSlotClick?.(currentDate, slot.hour, slot.minute)
                                }
                            >
                                {/* Indicador de horário cheio */}
                                <div className="absolute left-2 text-xs text-muted-foreground/50 pt-1">
                                    {slot.minute === 30 && `${slot.hour}:30`}
                                </div>
                            </div>
                        ))}

                        {/* Eventos do dia */}
                        <div className="absolute inset-0 left-2 right-2">
                            {dayEvents.map((event) => (
                                <EventBlock
                                    key={event.id}
                                    event={event}
                                    slotHeight={SLOT_HEIGHT}
                                    onClick={onEventClick}
                                />
                            ))}
                        </div>

                        {/* Linha indicando hora atual */}
                        {isToday(currentDate) && <CurrentTimeLine slotHeight={SLOT_HEIGHT} />}
                    </div>
                </div>
            </div>

            {/* Overlay de loading */}
            {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            )}
        </div>
    );
}

// Componente para mostrar a linha da hora atual
function CurrentTimeLine({ slotHeight }: { slotHeight: number }) {
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Atualiza a cada minuto
        return () => clearInterval(timer);
    }, []);

    const hour = now.getHours();
    const minute = now.getMinutes();

    // Só mostra se estiver dentro do horário comercial (8-19h)
    if (hour < 8 || hour >= 19) return null;

    const totalMinutesFromStart = (hour - 8) * 60 + minute;
    const top = (totalMinutesFromStart / 30) * slotHeight;

    return (
        <div
            className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
            style={{ top: `${top}px` }}
        >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="flex-1 h-0.5 bg-red-500" />
        </div>
    );
}
