-- Migration: Security Fix for RLS
-- Date: 2026-01-15
-- Description: Updates RLS policy for 'bookings' table to allow 'public' (including anonymous) users to insert bookings.
-- Previous policy "Authenticated users can insert bookings" was too restrictive for guest users (role 'anon').

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;

-- 2. Create a new, more permissive policy for INSERT
-- We target 'public' to cover both 'anon' (guest) and 'authenticated' (logged in) roles.
CREATE POLICY "Public users can insert bookings"
    ON public.bookings
    FOR INSERT
    TO public
    WITH CHECK (
        -- Allow if user is logged in AND sets their ID correctly
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR
        -- OR allow if user_id is NULL (anonymous guest booking)
        (user_id IS NULL)
    );

-- 3. Ensure 'anon' role has privileges (redundant safety check)
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT ON public.bookings TO anon;
