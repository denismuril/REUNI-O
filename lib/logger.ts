/**
 * Logger de Acesso - Registra ações do sistema para auditoria
 * 
 * Implementação simplificada que loga no console.
 * Para produção, pode ser integrado com serviços como DataDog, LogRocket, etc.
 */

export type LogAction =
    | "login"
    | "logout"
    | "booking_created"
    | "booking_cancelled"
    | "booking_admin_deleted"
    | "otp_requested"
    | "otp_verified"
    | "otp_failed"
    | "admin_login"
    | "admin_action";

interface LogDetails {
    bookingId?: string;
    bookingTitle?: string;
    roomName?: string;
    reason?: string;
    [key: string]: unknown;
}

interface AccessLog {
    id: string;
    userEmail: string | null;
    action: LogAction;
    details: LogDetails;
    ipAddress: string | null;
    createdAt: Date;
}

/**
 * Registra uma ação no log de acesso
 */
export async function logAccess(
    action: LogAction,
    userEmail: string | null,
    details?: LogDetails,
    ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            userEmail,
            details: details || {},
            ipAddress: ipAddress || null,
        };

        // Log no console em desenvolvimento
        if (process.env.NODE_ENV === "development") {
            console.log("[Logger]", JSON.stringify(logEntry, null, 2));
        } else {
            // Em produção, log simplificado
            console.log(`[Logger] ${action} - ${userEmail || "anonymous"}`);
        }

        return { success: true };
    } catch (err) {
        console.error("[Logger] Exceção ao salvar log:", err);
        return { success: false, error: "Erro interno ao registrar log" };
    }
}

/**
 * Busca logs de acesso (stub - retorna array vazio)
 * 
 * Esta implementação não persiste logs.
 * Para funcionalidade completa, integre com um banco de dados.
 */
export async function getAccessLogs(_options?: {
    userEmail?: string;
    action?: LogAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}): Promise<{ data: AccessLog[]; error?: string }> {
    // Retorna array vazio - logs não são persistidos nesta implementação
    return { data: [] };
}
