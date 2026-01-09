-- Migration: Fix Email Support for Anonymous Bookings
-- Date: 2026-01-09

-- 1. Make user_id nullable in bookings table to allow anonymous bookings
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add creator_email column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS creator_email TEXT;

-- 3. Update RLS policies for bookings to allow anonymous inserts (if policy not exists, create it)
-- Note: 'authenticated' role is used for anyone logged in OR using the anon key with public access if configured, 
-- but usually anon key maps to 'anon' role.
-- Let's ensure 'anon' role can insert if we want truly public bookings without login.
-- However, standard Supabase usually requires at least 'anon' role.
-- Existing policy: "Authenticated users can insert bookings" WITH CHECK (auth.uid() = user_id);
-- We need to relax this or create a new one for when user_id is null.

DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;
CREATE POLICY "Authenticated users can insert bookings"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Allow if user is logged in AND sets their ID
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR
        -- OR allow if user_id is NULL (anonymous booking by authenticated/anon user)
        (user_id IS NULL)
    );

-- Allow 'anon' role to select and insert as well if not already handled
GRANT SELECT, INSERT ON public.bookings TO anon;

-- 4. Re-create booking_details view to handle NULL user_id (LEFT JOIN) and include creator_email
DROP VIEW IF EXISTS public.booking_details;

CREATE OR REPLACE VIEW public.booking_details AS
SELECT 
    b.id,
    b.title,
    b.description,
    b.start_time,
    b.end_time,
    b.status,
    b.is_recurring,
    b.recurrence_type,
    b.parent_booking_id,
    b.created_at,
    r.id AS room_id,
    r.name AS room_name,
    r.capacity AS room_capacity,
    r.equipment_list AS room_equipment,
    br.id AS branch_id,
    br.name AS branch_name,
    br.location AS branch_location,
    br.timezone AS branch_timezone,
    p.id AS user_id,
    COALESCE(p.full_name, b.creator_name, 'Anônimo') AS user_name, -- Fallback priority
    COALESCE(p.email, b.creator_email) AS user_email,           -- Fallback priority
    b.creator_name,
    b.creator_email
FROM public.bookings b
JOIN public.rooms r ON b.room_id = r.id
JOIN public.branches br ON r.branch_id = br.id
LEFT JOIN public.profiles p ON b.user_id = p.id -- Changed to LEFT JOIN
WHERE b.status != 'cancelled';

GRANT SELECT ON public.booking_details TO authenticated;
GRANT SELECT ON public.booking_details TO anon;

-- 5. Update request_cancellation_token to check creator_email first
CREATE OR REPLACE FUNCTION public.request_cancellation_token(p_booking_id UUID, p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_booking_email TEXT;
    v_creator_email TEXT;
    v_user_email TEXT;
BEGIN
    -- Get emails associated with booking
    SELECT 
        creator_email,
        (SELECT email FROM public.profiles WHERE id = bookings.user_id)
    INTO v_creator_email, v_user_email
    FROM public.bookings 
    WHERE id = p_booking_id;
    
    -- Determine authoritative email for this booking (prefer creator_email if set, else profile email)
    v_booking_email := COALESCE(v_creator_email, v_user_email);
    
    -- Validate
    IF v_booking_email IS NULL THEN
        RAISE EXCEPTION 'Reserva sem e-mail associado. Contate o suporte.';
    END IF;

    IF LOWER(TRIM(v_booking_email)) <> LOWER(TRIM(p_email)) THEN
        RAISE EXCEPTION 'Email provided (%) does not match booking email (%).', p_email, v_booking_email;
        -- In production, don't reveal the real email in error message to avoid enumeration
        -- RAISE EXCEPTION 'Email inválido para esta reserva.'; 
    END IF;

    -- Generate Token
    v_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Clean old tokens
    DELETE FROM public.cancellation_tokens WHERE booking_id = p_booking_id;
    
    -- Insert new token
    INSERT INTO public.cancellation_tokens (booking_id, token)
    VALUES (p_booking_id, v_token);

    RETURN v_token;
END;
$$;
