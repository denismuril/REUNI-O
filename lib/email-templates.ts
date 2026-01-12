/**
 * Templates de Email para notificações
 */

interface EmailTemplateProps {
    bookingId?: string;
    title: string;
    roomName: string;
    date: string;
    startTime: string;
    endTime: string;
    creatorName: string;
    cancellationLink?: string;
}

export function getBookingConfirmationTemplate(props: EmailTemplateProps): string {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #2563eb; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Reserva Confirmada</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Olá, <strong>${props.creatorName}</strong>!</p>
            <p>Sua reunião foi agendada com sucesso. Aqui estão os detalhes:</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Assunto:</strong> ${props.title}</p>
                <p style="margin: 5px 0;"><strong>Sala:</strong> ${props.roomName}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> ${props.date}</p>
                <p style="margin: 5px 0;"><strong>Horário:</strong> ${props.startTime} às ${props.endTime}</p>
            </div>

            <p>Para cancelar esta reserva, utilize o link abaixo (válido apenas se você tiver o acesso):</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Gerenciar Reservas</a>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
                Este é um email automático do sistema RESERVA. Por favor, não responda.
            </p>
        </div>
    </div>
    `;
}

export function getBookingReminderTemplate(props: EmailTemplateProps): string {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #f59e0b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Lembrete de Reunião</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Olá, <strong>${props.creatorName}</strong>!</p>
            <p>Sua reunião vai começar em breve (daqui a 1 hora). Não esqueça!</p>
            
            <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Assunto:</strong> ${props.title}</p>
                <p style="margin: 5px 0;"><strong>Sala:</strong> ${props.roomName}</p>
                <p style="margin: 5px 0;"><strong>Horário:</strong> ${props.startTime} às ${props.endTime}</p>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
                Este é um email automático do sistema RESERVA.
            </p>
        </div>
    </div>
    `;
}

export function getBookingCancellationTemplate(props: EmailTemplateProps): string {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Reserva Cancelada</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Olá, <strong>${props.creatorName}</strong>.</p>
            <p>Informamos que a seguinte reunião foi cancelada:</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Assunto:</strong> ${props.title}</p>
                <p style="margin: 5px 0;"><strong>Sala:</strong> ${props.roomName}</p>
                <p style="margin: 5px 0;"><strong>Data Original:</strong> ${props.date}</p>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
                Este é um email automático do sistema RESERVA.
            </p>
        </div>
    </div>
    `;
}
