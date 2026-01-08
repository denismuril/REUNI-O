"use client";

import React, { useMemo } from "react";
import {
    addDays,
    startOfWeek,
    format,
    isSameDay,
    isToday,
    isWeekend,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    CalendarEvent,
    BUSINESS_HOURS,
    generateTimeSlots,
    WEEKDAYS_SHORT,
} from "@/types/booking";
import { EventBlock } from "./EventBlock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeeklyViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onDateChange: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onSlotClick?: (date: Date, hour: number, minute: number) => void;
    isLoading?: boolean;
}

const SLOT_HEIGHT = 40; // pixels por slot de 30 minutos
const TIME_COLUMN_WIDTH = 60; // largura da coluna de horários

export function WeeklyView({
    currentDate,
    events,
    onDateChange,
    onEventClick,
    onSlotClick,
    isLoading = false,
}: WeeklyViewProps) {
    // Gera os dias da semana (Segunda a Sexta)
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira
        return Array.from({ length: 5 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    // Gera os time slots
    const timeSlots = useMemo(() => generateTimeSlots(), []);

    // Agrupa eventos por dia
    const eventsByDay = useMemo(() => {
        const grouped: Record<string, CalendarEvent[]> = {};
        weekDays.forEach((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            grouped[dayKey] = events.filter((event) =>
                isSameDay(new Date(event.startTime), day)
            );
        });
        return grouped;
    }, [events, weekDays]);

    const goToPreviousWeek = () => {
        onDateChange(addDays(currentDate, -7));
    };

    const goToNextWeek = () => {
        onDateChange(addDays(currentDate, 7));
    };

    const goToToday = () => {
        onDateChange(new Date());
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border shadow-sm">
            {/* Header com navegação */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Hoje
                    </Button>
                </div>
                <h2 className="text-lg font-semibold">
                    {format(weekDays[0], "d 'de' MMMM", { locale: ptBR })} -{" "}
                    {format(weekDays[4], "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                <div className="w-32" /> {/* Spacer para centralizar o título */}
            </div>

            {/* Cabeçalho dos dias */}
            <div className="flex border-b sticky top-0 bg-background z-10">
                <div
                    className="flex-shrink-0 border-r bg-muted/20"
                    style={{ width: TIME_COLUMN_WIDTH }}
                />
                {weekDays.map((day, index) => (
                    <div
                        key={day.toISOString()}
                        className={cn(
                            "flex-1 text-center py-3 border-r last:border-r-0",
                            isToday(day) && "bg-primary/10",
                            isWeekend(day) && "bg-muted/30"
                        )}
                    >
                        <div className="text-xs text-muted-foreground uppercase">
                            {WEEKDAYS_SHORT[day.getDay()]}
                        </div>
                        <div
                            className={cn(
                                "text-lg font-semibold",
                                isToday(day) && "text-primary"
                            )}
                        >
                            {format(day, "d")}
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid do calendário */}
            <div className="flex-1 overflow-auto">
                <div className="flex min-h-full">
                    {/* Coluna de horários */}
                    <div
                        className="flex-shrink-0 border-r bg-muted/10"
                        style={{ width: TIME_COLUMN_WIDTH }}
                    >
                        {timeSlots.map((slot, index) => (
                            <div
                                key={slot.label}
                                className={cn(
                                    "text-xs text-muted-foreground text-right pr-2 border-b",
                                    slot.minute === 0 && "font-medium"
                                )}
                                style={{ height: SLOT_HEIGHT }}
                            >
                                {slot.minute === 0 && slot.label}
                            </div>
                        ))}
                    </div>

                    {/* Colunas dos dias */}
                    {weekDays.map((day) => {
                        const dayKey = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDay[dayKey] || [];

                        return (
                            <div
                                key={dayKey}
                                className={cn(
                                    "flex-1 border-r last:border-r-0 relative",
                                    isToday(day) && "bg-primary/5",
                                    isWeekend(day) && "bg-muted/20"
                                )}
                            >
                                {/* Linhas de fundo para cada slot */}
                                {timeSlots.map((slot, index) => (
                                    <div
                                        key={slot.label}
                                        className={cn(
                                            "border-b hover:bg-accent/30 cursor-pointer transition-colors",
                                            slot.minute === 0 && "border-b-muted-foreground/20"
                                        )}
                                        style={{ height: SLOT_HEIGHT }}
                                        onClick={() => onSlotClick?.(day, slot.hour, slot.minute)}
                                    />
                                ))}

                                {/* Eventos do dia */}
                                <div className="absolute inset-0">
                                    {dayEvents.map((event) => (
                                        <EventBlock
                                            key={event.id}
                                            event={event}
                                            slotHeight={SLOT_HEIGHT}
                                            onClick={onEventClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
