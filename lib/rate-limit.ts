/**
 * Rate Limiter - Limita tentativas por chave (email, IP, etc.)
 * 
 * Para produção, recomenda-se usar Redis ao invés de Map em memória
 */

interface RateLimitEntry {
    attempts: number;
    firstAttempt: number;
}

// Armazena tentativas em memória (reinicia quando o servidor reinicia)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurações padrão
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Verifica se uma chave está bloqueada por rate limiting
 */
export function isRateLimited(
    key: string,
    maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
    windowMs: number = DEFAULT_WINDOW_MS
): { limited: boolean; remainingAttempts: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Se não existe entrada, não está limitado
    if (!entry) {
        return { limited: false, remainingAttempts: maxAttempts, resetIn: 0 };
    }

    // Se a janela de tempo expirou, limpa e permite
    if (now - entry.firstAttempt > windowMs) {
        rateLimitStore.delete(key);
        return { limited: false, remainingAttempts: maxAttempts, resetIn: 0 };
    }

    // Calcula tentativas restantes e tempo para reset
    const remainingAttempts = Math.max(0, maxAttempts - entry.attempts);
    const resetIn = Math.ceil((entry.firstAttempt + windowMs - now) / 1000); // em segundos

    return {
        limited: entry.attempts >= maxAttempts,
        remainingAttempts,
        resetIn,
    };
}

/**
 * Registra uma tentativa para uma chave
 */
export function recordAttempt(key: string): void {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry) {
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
    } else {
        entry.attempts += 1;
        rateLimitStore.set(key, entry);
    }
}

/**
 * Remove o rate limiting de uma chave (após sucesso, por exemplo)
 */
export function clearRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

/**
 * Limpa entradas expiradas do store (pode ser chamado periodicamente)
 */
export function cleanupExpiredEntries(windowMs: number = DEFAULT_WINDOW_MS): number {
    const now = Date.now();
    let cleaned = 0;

    rateLimitStore.forEach((entry, key) => {
        if (now - entry.firstAttempt > windowMs) {
            rateLimitStore.delete(key);
            cleaned++;
        }
    });

    return cleaned;
}
