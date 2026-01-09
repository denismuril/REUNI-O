/**
 * Tipos para o estado do Calendário e componentes de booking
 */

import { Booking, BookingDetails, Room, Branch } from './supabase';

// ============================================================
// Tipos de visualização do calendário
// ============================================================

export type CalendarViewType = 'weekly' | 'daily';

export interface TimeSlot {
    hour: number;
    minute: number;
    label: string; // "08:00", "08:30", etc.
}

export interface CalendarDay {
    date: Date;
    dayOfWeek: number; // 0-6 (Domingo-Sábado)
    dayName: string; // "Segunda", "Terça", etc.
    isToday: boolean;
    isWeekend: boolean;
}

export interface CalendarState {
    currentDate: Date;
    viewType: CalendarViewType;
    selectedBranch: Branch | null;
    selectedRoom: Room | null;
    bookings: BookingDetails[];
    isLoading: boolean;
    error: string | null;
}

// ============================================================
// Tipos para blocos de eventos no calendário
// ============================================================

export interface EventBlockPosition {
    top: number; // Posição vertical em pixels ou porcentagem
    height: number; // Altura do bloco
    left: number; // Posição horizontal (para múltiplas colunas)
    width: number; // Largura (para múltiplas colunas)
}

export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    roomId: string;
    roomName: string;
    userId: string;
    userName: string;
    userEmail: string;
    creatorName?: string | null;
    isRecurring: boolean;
    status: 'confirmed' | 'cancelled' | 'pending';
    position?: EventBlockPosition;
}

// ============================================================
// Tipos para o formulário de booking
// ============================================================

export type RecurrenceType = 'none' | 'daily' | 'weekly';

export interface BookingFormData {
    branchId: string;
    roomId: string;
    title: string;
    description?: string;
    creatorName: string;
    date: Date;
    startTime: string; // "HH:mm" format
    endTime: string; // "HH:mm" format
    recurrence: RecurrenceType;
}

export interface BookingFormProps {
    initialData?: Partial<BookingFormData>;
    onSubmit: (data: BookingFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

// ============================================================
// Tipos para verificação de disponibilidade
// ============================================================

export interface AvailabilityCheck {
    roomId: string;
    startTime: Date;
    endTime: Date;
    excludeBookingId?: string;
}

export interface AvailabilityResult {
    isAvailable: boolean;
    conflictingBookings?: BookingDetails[];
}

// ============================================================
// Tipos para filtros do calendário
// ============================================================

export interface CalendarFilters {
    branchId?: string;
    roomId?: string;
    dateRange: {
        start: Date;
        end: Date;
    };
    showCancelled?: boolean;
}

// ============================================================
// Tipos para notificações por email
// ============================================================

export interface EmailNotificationPayload {
    type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'booking_reminder';
    booking: BookingDetails;
    recipientEmail: string;
    recipientName: string;
    additionalData?: Record<string, unknown>;
}

// ============================================================
// Constantes úteis
// ============================================================

export const BUSINESS_HOURS = {
    start: 8, // 8:00 AM
    end: 19, // 7:00 PM
} as const;

export const SLOT_DURATION_MINUTES = 30;

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

// Gera os time slots para o calendário
export function generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
        slots.push({
            hour,
            minute: 0,
            label: `${hour.toString().padStart(2, '0')}:00`,
        });
        slots.push({
            hour,
            minute: 30,
            label: `${hour.toString().padStart(2, '0')}:30`,
        });
    }
    return slots;
}

// Calcula a posição do evento no calendário
export function calculateEventPosition(
    startTime: Date,
    endTime: Date,
    slotHeight: number = 40
): EventBlockPosition {
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    const startOffset = (startHour - BUSINESS_HOURS.start) * 2 + (startMinute >= 30 ? 1 : 0);
    const endOffset = (endHour - BUSINESS_HOURS.start) * 2 + (endMinute >= 30 ? 1 : 0);

    return {
        top: startOffset * slotHeight,
        height: (endOffset - startOffset) * slotHeight,
        left: 0,
        width: 100,
    };
}
