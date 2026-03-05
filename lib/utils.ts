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
 * Retorna qual ocorrência do dia da semana é dentro do mês (1ª, 2ª, 3ª, 4ª, 5ª)
 * Ex: Se a data é a 2ª quinta-feira do mês, retorna 2
 */
export function getWeekdayOccurrence(date: Date): number {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
}

/**
 * Retorna a data da N-ésima ocorrência de um dia da semana em um mês/ano específico
 * Ex: getNthWeekdayOfMonth(2026, 3, 4, 1) → 1ª quinta-feira de abril de 2026
 * Retorna null se a ocorrência não existir (ex: 5ª segunda de fevereiro)
 */
export function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date | null {
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Dia da semana do primeiro dia
    const firstDayOfWeek = firstDay.getDay();

    // Calcula o dia do mês para a 1ª ocorrência desse dia da semana
    let firstOccurrenceDay = dayOfWeek - firstDayOfWeek + 1;
    if (firstOccurrenceDay <= 0) firstOccurrenceDay += 7;

    // N-ésima ocorrência
    const targetDay = firstOccurrenceDay + (n - 1) * 7;

    // Verifica se ainda está no mesmo mês
    const result = new Date(year, month, targetDay);
    if (result.getMonth() !== month) return null;

    return result;
}

/**
 * Retorna o nome ordinal em português (1ª, 2ª, 3ª, etc.)
 */
export function getOrdinalPtBR(n: number): string {
    const ordinals: Record<number, string> = { 1: '1ª', 2: '2ª', 3: '3ª', 4: '4ª', 5: '5ª' };
    return ordinals[n] || `${n}ª`;
}

/**
 * Retorna o nome do dia da semana em português
 */
export function getWeekdayNamePtBR(dayOfWeek: number): string {
    const names = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return names[dayOfWeek] || '';
}

/**
 * Gera datas para recorrência
 */
export function generateRecurringDates(
    startDate: Date,
    recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom',
    options?: {
        endDate?: Date;
        monthsAhead?: number;
        daysOfWeek?: number[]; // 0-6 (custom)
        monthlyPattern?: 'same_day' | 'same_weekday';
        weeklyDayOfWeek?: number; // 0-6 Dia da semana explícito (weekly)
        monthlyDay?: number; // 1-31 Dia do mês explícito (monthly same_day)
        monthlyWeekdayOccurrence?: number; // 1-5 (monthly same_weekday)
        monthlyWeekdayNumber?: number; // 0-6 (monthly same_weekday)
    }
): Date[] {
    const dates: Date[] = [];

    // Define data final (padrão 3 meses se não especificado)
    let finalDate: Date;
    if (options?.endDate) {
        finalDate = new Date(options.endDate);
        finalDate.setHours(23, 59, 59, 999);
    } else {
        finalDate = new Date(startDate);
        finalDate.setMonth(finalDate.getMonth() + (options?.monthsAhead || 3));
    }

    // Para mensal com same_weekday, usamos lógica especial
    if (recurrenceType === 'monthly' && options?.monthlyPattern === 'same_weekday') {
        const targetDayOfWeek = options?.monthlyWeekdayNumber ?? startDate.getDay();
        const targetOccurrence = options?.monthlyWeekdayOccurrence ?? getWeekdayOccurrence(startDate);

        // Iterar mês a mês a partir do mês seguinte
        let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

        while (currentMonth <= finalDate) {
            const candidate = getNthWeekdayOfMonth(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                targetDayOfWeek,
                targetOccurrence
            );

            if (candidate && candidate <= finalDate) {
                dates.push(candidate);
            }

            // Próximo mês
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }

        return dates;
    }

    // Para os demais tipos, iterar dia a dia
    let currentDate = new Date(startDate);
    // Começar do dia SEGUINTE para evitar duplicação da reserva principal
    currentDate.setDate(currentDate.getDate() + 1);

    // Para weekly, usar o dia explícito ou o dia da data de início
    const weeklyTarget = options?.weeklyDayOfWeek ?? startDate.getDay();
    // Para monthly same_day, usar o dia explícito ou o dia do mês de início
    const monthlyDayTarget = options?.monthlyDay ?? startDate.getDate();

    while (currentDate <= finalDate) {
        const dayOfWeek = currentDate.getDay(); // 0 (Dom) - 6 (Sáb)

        let shouldAdd = false;

        switch (recurrenceType) {
            case 'daily':
                // Apenas dias úteis (Segunda a Sexta)
                shouldAdd = dayOfWeek >= 1 && dayOfWeek <= 5;
                break;
            case 'weekly':
                // Dia da semana escolhido pelo usuário
                shouldAdd = dayOfWeek === weeklyTarget;
                break;
            case 'monthly':
                // Dia do mês escolhido pelo usuário (same_day ou padrão)
                if (currentDate.getDate() === monthlyDayTarget) {
                    shouldAdd = true;
                }
                break;
            case 'custom':
                if (options?.daysOfWeek && options.daysOfWeek.length > 0) {
                    if (options.daysOfWeek.includes(dayOfWeek)) {
                        shouldAdd = true;
                    }
                }
                break;
        }

        if (shouldAdd) {
            dates.push(new Date(currentDate));
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

