import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formata uma data para exibição
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
    };
    return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(date);
}

/**
 * Formata hora para exibição
 */
export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: Date): string {
    return `${formatDate(date)} às ${formatTime(date)}`;
}

/**
 * Combina uma data com uma string de hora (HH:mm)
 */
export function combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

/**
 * Gera datas para recorrência diária ou semanal
 */
export function generateRecurringDates(
    startDate: Date,
    recurrenceType: 'daily' | 'weekly',
    monthsAhead: number = 3
): Date[] {
    const dates: Date[] = [];
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsAhead);

    const increment = recurrenceType === 'daily' ? 1 : 7;
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + increment);
    }

    return dates;
}
