-- ============================================================
-- Corporate Meeting Room Booking System
-- Initial Migration - Tables, RLS, Functions & Triggers
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
-- Links to auth.users and stores user information
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. BRANCHES TABLE
-- Company locations/offices
-- ============================================================
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Branches RLS Policies
CREATE POLICY "Branches are viewable by authenticated users"
    ON public.branches
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can insert branches"
    ON public.branches
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Only admins can update branches"
    ON public.branches
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Only admins can delete branches"
    ON public.branches
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- ============================================================
-- 3. ROOMS TABLE
-- Meeting rooms within branches
-- ============================================================
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
    equipment_list TEXT[] DEFAULT '{}',
    description TEXT,
    floor TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (branch_id, name)
);

-- Create indexes
CREATE INDEX idx_rooms_branch ON public.rooms(branch_id);
CREATE INDEX idx_rooms_capacity ON public.rooms(capacity);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Rooms RLS Policies
CREATE POLICY "Rooms are viewable by authenticated users"
    ON public.rooms
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can insert rooms"
    ON public.rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Only admins can update rooms"
    ON public.rooms
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Only admins can delete rooms"
    ON public.rooms
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- ============================================================
-- 4. BOOKINGS TABLE
-- Room reservations with recurring event support
-- ============================================================
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', NULL)),
    parent_booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure end_time is after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    -- Ensure booking duration is reasonable (max 8 hours)
    CONSTRAINT max_duration CHECK (end_time - start_time <= INTERVAL '8 hours')
);

-- Create indexes for performance
CREATE INDEX idx_bookings_room ON public.bookings(room_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_time ON public.bookings(start_time, end_time);
CREATE INDEX idx_bookings_parent ON public.bookings(parent_booking_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings RLS Policies
CREATE POLICY "Bookings are viewable by authenticated users"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert bookings"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any booking"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Users can delete their own bookings"
    ON public.bookings
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any booking"
    ON public.bookings
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- ============================================================
-- 5. AVAILABILITY CHECK FUNCTION
-- Returns TRUE if the slot is available, FALSE if there's a conflict
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_availability(
    p_room_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.bookings
    WHERE room_id = p_room_id
      AND status = 'confirmed'
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      -- Check for overlapping times
      AND start_time < p_end_time
      AND end_time > p_start_time;
    
    RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. DOUBLE BOOKING PREVENTION TRIGGER
-- Enforces availability at database level
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip check for cancelled bookings
    IF NEW.status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    -- Check availability
    IF NOT public.check_availability(
        NEW.room_id,
        NEW.start_time,
        NEW.end_time,
        CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    ) THEN
        RAISE EXCEPTION 'DOUBLE_BOOKING: This time slot is already booked for the selected room.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_booking_availability
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_double_booking();

-- ============================================================
-- 7. RECURRING BOOKING EXPANSION FUNCTION
-- Expands a recurring booking into individual records for 3 months
-- ============================================================
CREATE OR REPLACE FUNCTION public.expand_recurring_booking(
    p_room_id UUID,
    p_user_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_recurrence_type TEXT,
    p_months_ahead INTEGER DEFAULT 3
)
RETURNS SETOF public.bookings AS $$
DECLARE
    v_parent_id UUID;
    v_current_start TIMESTAMPTZ;
    v_current_end TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_interval INTERVAL;
    v_booking public.bookings;
BEGIN
    -- Calculate end date (3 months ahead by default)
    v_end_date := p_start_time + (p_months_ahead || ' months')::INTERVAL;
    
    -- Set interval based on recurrence type
    IF p_recurrence_type = 'daily' THEN
        v_interval := INTERVAL '1 day';
    ELSIF p_recurrence_type = 'weekly' THEN
        v_interval := INTERVAL '1 week';
    ELSE
        RAISE EXCEPTION 'Invalid recurrence type: %', p_recurrence_type;
    END IF;
    
    -- Create parent booking first
    INSERT INTO public.bookings (
        room_id, user_id, title, description,
        start_time, end_time, is_recurring, recurrence_type
    )
    VALUES (
        p_room_id, p_user_id, p_title, p_description,
        p_start_time, p_end_time, true, p_recurrence_type
    )
    RETURNING * INTO v_booking;
    
    v_parent_id := v_booking.id;
    RETURN NEXT v_booking;
    
    -- Generate recurring instances
    v_current_start := p_start_time + v_interval;
    v_current_end := p_end_time + v_interval;
    
    WHILE v_current_start < v_end_date LOOP
        -- Check if this slot is available
        IF public.check_availability(p_room_id, v_current_start, v_current_end) THEN
            INSERT INTO public.bookings (
                room_id, user_id, title, description,
                start_time, end_time, is_recurring, recurrence_type, parent_booking_id
            )
            VALUES (
                p_room_id, p_user_id, p_title, p_description,
                v_current_start, v_current_end, true, p_recurrence_type, v_parent_id
            )
            RETURNING * INTO v_booking;
            
            RETURN NEXT v_booking;
        END IF;
        
        v_current_start := v_current_start + v_interval;
        v_current_end := v_current_end + v_interval;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. UPDATED_AT TRIGGER FUNCTION
-- Automatically updates the updated_at column
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON public.branches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. SEED DATA (Optional - for development)
-- ============================================================
-- Uncomment the following to seed initial data

/*
-- Insert sample branches
INSERT INTO public.branches (name, location, address, timezone) VALUES
    ('Headquarters', 'São Paulo', 'Av. Paulista, 1000', 'America/Sao_Paulo'),
    ('Tech Hub', 'Rio de Janeiro', 'Av. Rio Branco, 500', 'America/Sao_Paulo'),
    ('Innovation Center', 'Belo Horizonte', 'Rua da Bahia, 200', 'America/Sao_Paulo');

-- Insert sample rooms (you'll need to replace branch_id with actual UUIDs)
-- This can be done after branches are inserted
*/

-- ============================================================
-- 10. HELPER VIEWS
-- ============================================================

-- View for booking details with user and room info
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
    p.full_name AS user_name,
    p.email AS user_email
FROM public.bookings b
JOIN public.rooms r ON b.room_id = r.id
JOIN public.branches br ON r.branch_id = br.id
JOIN public.profiles p ON b.user_id = p.id
WHERE b.status != 'cancelled';

-- Grant access to the view
GRANT SELECT ON public.booking_details TO authenticated;
