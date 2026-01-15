"use client";

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookingCancellation } from "@/hooks/useBookingCancellation";
import { CalendarEvent } from "@/types/booking";

// Re-export CalendarEvent for convenience
export type { CalendarEvent } from "@/types/booking";

interface BookingDetailsModalProps {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onCancelled?: () => void;
}

/**
 * Modal para exibição de detalhes de uma reserva e fluxo de cancelamento
 * Extraído de app/page.tsx para melhor organização do código
 */
export function BookingDetailsModal({
    event,
    isOpen,
    onClose,
    onCancelled,
}: BookingDetailsModalProps) {
    const {
        isCancelling,
        cancelStep,
        cancelEmail,
        cancelToken,
        cancelError,
        isProcessingCancel,
        setCancelEmail,
        setCancelToken,
        startCancellation,
        requestToken,
        confirmCancel,
        resetState,
        goBack,
    } = useBookingCancellation({
        onCancelled: () => {
            onClose();
            onCancelled?.();
        },
    });

    // Não renderiza se não houver evento ou modal fechado
    if (!event || !isOpen) {
        return null;
    }

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleRequestToken = async () => {
        await requestToken(event.id);
    };

    const handleConfirmCancellation = async () => {
        await confirmCancel(event.id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card border rounded-lg shadow-lg w-full max-w-md p-6 relative">
                {/* Botão Fechar */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4"
                    onClick={handleClose}
                >
                    <span className="sr-only">Fechar</span>
                    <Plus className="h-4 w-4 rotate-45" />
                </Button>

                {!isCancelling ? (
                    // Visualização de Detalhes
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">{event.roomName}</p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Data:</span>
                                <span className="font-medium">
                                    {format(event.startTime, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Horário:</span>
                                <span className="font-medium">
                                    {format(event.startTime, "HH:mm")} -{" "}
                                    {format(event.endTime, "HH:mm")}
                                </span>
                            </div>
                            {event.description && (
                                <div className="py-1 border-b">
                                    <span className="text-muted-foreground block mb-1">
                                        Descrição:
                                    </span>
                                    <p className="whitespace-pre-wrap">{event.description}</p>
                                </div>
                            )}
                            <div className="py-1">
                                <span className="text-muted-foreground block mb-1">
                                    Responsável:
                                </span>
                                <span className="font-medium uppercase">
                                    {event.creatorName || event.userName || "Anônimo"}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={handleClose}>
                                Fechar
                            </Button>
                            <Button variant="destructive" onClick={startCancellation}>
                                Cancelar Reserva
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Fluxo de Cancelamento
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-destructive">
                            Cancelar Reserva
                        </h3>

                        {cancelStep === "email" ? (
                            // Step 1: Solicitar e-mail
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Para segurança, confirme o e-mail utilizado na reserva.
                                    Enviaremos um código de validação.
                                </p>
                                <div className="space-y-2">
                                    <Label>Seu E-mail</Label>
                                    <Input
                                        type="email"
                                        placeholder="ex: nome@empresa.com"
                                        value={cancelEmail}
                                        onChange={(e) => setCancelEmail(e.target.value)}
                                    />
                                </div>
                                {cancelError && (
                                    <p className="text-xs text-destructive font-medium">
                                        {cancelError}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" onClick={goBack}>
                                        Voltar
                                    </Button>
                                    <Button
                                        onClick={handleRequestToken}
                                        disabled={isProcessingCancel || !cancelEmail}
                                    >
                                        {isProcessingCancel ? "Enviando..." : "Enviar Código"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Step 2: Confirmar com OTP
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Insira o código enviado para{" "}
                                    <strong>{cancelEmail}</strong>.
                                </p>
                                <div className="space-y-2">
                                    <Label>Código de Validação</Label>
                                    <Input
                                        placeholder="000000"
                                        value={cancelToken}
                                        onChange={(e) => setCancelToken(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                                {cancelError && (
                                    <p className="text-xs text-destructive font-medium">
                                        {cancelError}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" onClick={goBack}>
                                        Voltar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleConfirmCancellation}
                                        disabled={isProcessingCancel || !cancelToken}
                                    >
                                        {isProcessingCancel
                                            ? "Cancelando..."
                                            : "Confirmar Cancelamento"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
