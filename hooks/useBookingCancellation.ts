"use client";

import { useState, useCallback } from "react";
import { requestCancellation, confirmCancellation } from "@/app/actions/cancel-booking";

export type CancelStep = "email" | "otp";

export interface UseBookingCancellationProps {
    onCancelled?: () => void;
}

export interface UseBookingCancellationReturn {
    // Estados
    isCancelling: boolean;
    cancelStep: CancelStep;
    cancelEmail: string;
    cancelToken: string;
    cancelError: string;
    isProcessingCancel: boolean;

    // Setters
    setCancelEmail: (email: string) => void;
    setCancelToken: (token: string) => void;

    // Ações
    startCancellation: () => void;
    requestToken: (bookingId: string) => Promise<void>;
    confirmCancel: (bookingId: string) => Promise<boolean>;
    resetState: () => void;
    goBack: () => void;
}

/**
 * Hook customizado para gerenciar o fluxo de cancelamento de reservas
 * Encapsula toda a lógica de estado e chamadas de API para cancelamento
 */
export function useBookingCancellation(
    props?: UseBookingCancellationProps
): UseBookingCancellationReturn {
    const { onCancelled } = props || {};

    // Estados do fluxo de cancelamento
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelStep, setCancelStep] = useState<CancelStep>("email");
    const [cancelEmail, setCancelEmail] = useState("");
    const [cancelToken, setCancelToken] = useState("");
    const [cancelError, setCancelError] = useState("");
    const [isProcessingCancel, setIsProcessingCancel] = useState(false);

    /**
     * Inicia o fluxo de cancelamento
     */
    const startCancellation = useCallback(() => {
        setIsCancelling(true);
        setCancelStep("email");
        setCancelError("");
    }, []);

    /**
     * Reseta todos os estados para o valor inicial
     */
    const resetState = useCallback(() => {
        setIsCancelling(false);
        setCancelStep("email");
        setCancelEmail("");
        setCancelToken("");
        setCancelError("");
        setIsProcessingCancel(false);
    }, []);

    /**
     * Volta para o passo anterior no fluxo
     */
    const goBack = useCallback(() => {
        if (cancelStep === "otp") {
            setCancelStep("email");
            setCancelError("");
        } else {
            setIsCancelling(false);
        }
    }, [cancelStep]);

    /**
     * Solicita o envio do token OTP para o e-mail
     */
    const requestToken = useCallback(async (bookingId: string) => {
        if (!cancelEmail) {
            setCancelError("Digite o email usado na reserva.");
            return;
        }

        setIsProcessingCancel(true);
        setCancelError("");

        const res = await requestCancellation(bookingId, cancelEmail);
        setIsProcessingCancel(false);

        if (res.success) {
            setCancelStep("otp");
            setCancelError("");
        } else {
            setCancelError(res.message || "Erro ao solicitar código.");
        }
    }, [cancelEmail]);

    /**
     * Confirma o cancelamento usando o token OTP
     * Retorna true se o cancelamento foi bem-sucedido
     */
    const confirmCancel = useCallback(async (bookingId: string): Promise<boolean> => {
        if (!cancelToken) {
            setCancelError("Digite o código recebido.");
            return false;
        }

        setIsProcessingCancel(true);
        setCancelError("");

        const res = await confirmCancellation(bookingId, cancelToken);
        setIsProcessingCancel(false);

        if (res.success) {
            resetState();
            onCancelled?.();
            return true;
        } else {
            setCancelError(res.message || "Código inválido.");
            return false;
        }
    }, [cancelToken, resetState, onCancelled]);

    return {
        // Estados
        isCancelling,
        cancelStep,
        cancelEmail,
        cancelToken,
        cancelError,
        isProcessingCancel,

        // Setters
        setCancelEmail,
        setCancelToken,

        // Ações
        startCancellation,
        requestToken,
        confirmCancel,
        resetState,
        goBack,
    };
}
