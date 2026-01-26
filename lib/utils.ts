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
/**
 * Gera datas para recorrência
 */
export function generateRecurringDates(
    startDate: Date,
    recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom',
    options?: {
        endDate?: Date;
        monthsAhead?: number;
        daysOfWeek?: number[]; // 0-6
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

    let currentDate = new Date(startDate);
    // Avança um dia para não incluir a data de início (que já é criada como a reserva principal)
    // Se a lógica do backend espera que a lista inclua a data inicial ou não, isso deve ser ajustado.
    // Assumindo aqui que geramos OS FILHOS, então começamos do próximo.
    // PORÉM, para simplificar a lógica de "dias da semana", é mais fácil iterar dia a dia.

    // Vamos começar do dia SEGUINTE ao start date para evitar duplicação da reserva principal
    currentDate.setDate(currentDate.getDate() + 1);

    while (currentDate <= finalDate) {
        const dayOfWeek = currentDate.getDay(); // 0 (Dom) - 6 (Sáb)

        let shouldAdd = false;

        switch (recurrenceType) {
            case 'daily':
                shouldAdd = true;
                break;
            case 'weekly':
                // Mesmo dia da semana da data original
                shouldAdd = dayOfWeek === startDate.getDay();
                break;
            case 'monthly':
                // Mesmo dia do mês (atenção para meses com menos dias)
                // Se start date for dia 31, em meses com 30 dias pode pular ou ajustar.
                // Simples implementação: verifica se o dia do mês bate.
                if (currentDate.getDate() === startDate.getDate()) {
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

        // Avança o loop
        // Otimização: para weekly/monthly poderia pular mais, mas dia-a-dia cobre 'custom' corretamente
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}
