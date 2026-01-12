-- Tabela para agendar notificações futuras
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('reminder_1h', 'reminder_24h')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index para buscar notificações pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
ON scheduled_notifications(scheduled_for, status) 
WHERE status = 'pending';

-- Função para agendar lembrete automaticamente após criar reserva
CREATE OR REPLACE FUNCTION schedule_booking_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Agenda lembrete para 1 hora antes do início
    -- Apenas se a reserva for criada com mais de 1h de antecedência
    IF NEW.start_time > (NOW() + INTERVAL '1 hour 15 minutes') THEN
        INSERT INTO scheduled_notifications (booking_id, type, scheduled_for)
        VALUES (
            NEW.id, 
            'reminder_1h',
            NEW.start_time - INTERVAL '1 hour'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função após insert na tabela bookings
DROP TRIGGER IF EXISTS trigger_schedule_reminders ON bookings;
CREATE TRIGGER trigger_schedule_reminders
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION schedule_booking_reminders();
