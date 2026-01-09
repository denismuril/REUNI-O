"use client";

import React from "react";
import { CalendarEvent, BUSINESS_HOURS } from "@/types/booking";
import { formatTime } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EventBlockProps {
    event: CalendarEvent;
    slotHeight?: number;
    onClick?: (event: CalendarEvent) => void;
}

// Cores para diferenciar eventos de diferentes salas/usuários
const EVENT_COLORS = [
    "bg-blue-500/90 hover:bg-blue-600/90 border-blue-600",
    "bg-emerald-500/90 hover:bg-emerald-600/90 border-emerald-600",
    "bg-violet-500/90 hover:bg-violet-600/90 border-violet-600",
    "bg-amber-500/90 hover:bg-amber-600/90 border-amber-600",
    "bg-rose-500/90 hover:bg-rose-600/90 border-rose-600",
    "bg-cyan-500/90 hover:bg-cyan-600/90 border-cyan-600",
    "bg-fuchsia-500/90 hover:bg-fuchsia-600/90 border-fuchsia-600",
];

function getEventColor(eventId: string): string {
    // Gera um índice consistente baseado no ID do evento
    const hash = eventId.split("").reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

export function EventBlock({ event, slotHeight = 40, onClick }: EventBlockProps) {
    // Calcula a posição vertical baseada no horário
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();

    // Converte para slots (cada slot = 30 minutos)
    const startSlot =
        (startHour - BUSINESS_HOURS.start) * 2 + (startMinute >= 30 ? 1 : 0);
    const endSlot =
        (endHour - BUSINESS_HOURS.start) * 2 +
        (endMinute > 0 ? (endMinute > 30 ? 2 : 1) : 0);

    const top = startSlot * slotHeight;
    const height = Math.max((endSlot - startSlot) * slotHeight - 2, slotHeight - 2);

    const colorClass = getEventColor(event.roomId);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 cursor-pointer transition-all duration-200 shadow-sm",
                            "text-white text-xs overflow-hidden",
                            colorClass,
                            event.status === "cancelled" && "opacity-50 line-through"
                        )}
                        style={{
                            top: `${top}px`,
                            height: `${height}px`,
                        }}
                        onClick={() => onClick?.(event)}
                    >
                        <div className="font-semibold truncate">{event.title}</div>
                        {height > 40 && (
                            <>
                                <div className="text-xs opacity-90">
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </div>
                                {event.creatorName && (
                                    <div className="text-xs font-medium truncate opacity-95 mt-0.5">
                                        {event.creatorName}
                                    </div>
                                )}
                                <div className="text-xs opacity-75 truncate">{event.roomName}</div>
                            </>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-2">
                        <div>
                            <p className="font-semibold">{event.title}</p>
                            {event.description && (
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                            )}
                        </div>
                        <div className="text-sm space-y-1">
                            <p>
                                <span className="font-medium">Horário:</span>{" "}
                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </p>
                            <p>
                                <span className="font-medium">Sala:</span> {event.roomName}
                            </p>
                            <p>
                                <span className="font-medium">Reservado por:</span> {event.userName}
                            </p>
                            <p>
                                <span className="font-medium">Email:</span> {event.userEmail}
                            </p>
                            {event.isRecurring && (
                                <p className="text-xs text-muted-foreground italic">
                                    📅 Evento recorrente
                                </p>
                            )}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
