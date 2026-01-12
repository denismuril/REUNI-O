/**
 * Logger de Acesso - Registra ações do sistema para auditoria
 * 
 * Ações são salvas na tabela `access_logs` do Supabase
 */

import { createClient } from "@/lib/supabase/server";

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
        const supabase = await createClient();

        const { error } = await supabase.from("access_logs").insert({
            user_email: userEmail,
            action,
            details: details || {},
            ip_address: ipAddress || null,
        });

        if (error) {
            console.error("[Logger] Erro ao salvar log:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("[Logger] Exceção ao salvar log:", err);
        return { success: false, error: "Erro interno ao registrar log" };
    }
}

/**
 * Busca logs de acesso com filtros
 */
export async function getAccessLogs(options?: {
    userEmail?: string;
    action?: LogAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}): Promise<{ data: unknown[]; error?: string }> {
    try {
        const supabase = await createClient();

        let query = supabase
            .from("access_logs")
            .select("*")
            .order("created_at", { ascending: false });

        if (options?.userEmail) {
            query = query.eq("user_email", options.userEmail);
        }

        if (options?.action) {
            query = query.eq("action", options.action);
        }

        if (options?.startDate) {
            query = query.gte("created_at", options.startDate.toISOString());
        }

        if (options?.endDate) {
            query = query.lte("created_at", options.endDate.toISOString());
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        } else {
            query = query.limit(100);
        }

        const { data, error } = await query;

        if (error) {
            return { data: [], error: error.message };
        }

        return { data: data || [] };
    } catch (err) {
        console.error("[Logger] Erro ao buscar logs:", err);
        return { data: [], error: "Erro interno ao buscar logs" };
    }
}
