-- Tabela para armazenar tokens de cancelamento temporários
CREATE TABLE IF NOT EXISTS public.cancellation_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '15 minutes')
);

-- Habilitar RLS
ALTER TABLE public.cancellation_tokens ENABLE ROW LEVEL SECURITY;

-- Bloquear acesso direto (tudo via func)
CREATE POLICY "No public access" ON public.cancellation_tokens
    FOR ALL
    TO public
    USING (false);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_booking_id ON public.cancellation_tokens(booking_id);

-- FUNÇÃO 1: Solicitar Cancelamento (Gera Token)
CREATE OR REPLACE FUNCTION public.request_cancellation_token(p_booking_id UUID, p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Roda om privilegios de admin
AS $$
DECLARE
    v_token TEXT;
    v_booking_email TEXT;
BEGIN
    -- Verificar email da reserva
    SELECT user_email INTO v_booking_email FROM public.bookings WHERE id = p_booking_id;
    
    -- Normalizar e comparar
    IF v_booking_email IS NULL OR LOWER(TRIM(v_booking_email)) <> LOWER(TRIM(p_email)) THEN
        RAISE EXCEPTION 'Email inválido para esta reserva.';
    END IF;

    -- Gerar Token 6 dígitos
    v_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Limpar tokens antigos
    DELETE FROM public.cancellation_tokens WHERE booking_id = p_booking_id;
    
    -- Inserir novo
    INSERT INTO public.cancellation_tokens (booking_id, token)
    VALUES (p_booking_id, v_token);

    RETURN v_token;
END;
$$;

-- FUNÇÃO 2: Confirmar Cancelamento
CREATE OR REPLACE FUNCTION public.confirm_cancellation(p_booking_id UUID, p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_valid BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.cancellation_tokens
        WHERE booking_id = p_booking_id 
        AND token = p_token
        AND expires_at > NOW()
    ) INTO v_valid;

    IF v_valid THEN
        -- Deletar reserva (Cascade apaga o token)
        DELETE FROM public.bookings WHERE id = p_booking_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cancellation_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.request_cancellation_token TO anon;
GRANT EXECUTE ON FUNCTION public.request_cancellation_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_cancellation TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_cancellation TO authenticated;
