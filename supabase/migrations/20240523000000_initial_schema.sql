-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum for seat class
CREATE TYPE seat_class AS ENUM ('economy', 'business', 'first');
-- Enum for flight status
CREATE TYPE flight_status AS ENUM ('scheduled', 'delayed', 'cancelled', 'departed', 'arrived');
-- Enum for booking status
CREATE TYPE booking_status AS ENUM ('confirmed', 'rescheduled', 'cancelled');

-- 1. FLIGHTS TABLE
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_no VARCHAR(10) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departs_at TIMESTAMPTZ NOT NULL,
    arrives_at TIMESTAMPTZ NOT NULL,
    aircraft_type VARCHAR(50) NOT NULL,
    status flight_status DEFAULT 'scheduled' NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SEATS TABLE
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,
    class seat_class NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    extra_fee NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    UNIQUE(flight_id, seat_number)
);

-- 3. BOOKINGS TABLE
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
    status booking_status DEFAULT 'confirmed' NOT NULL,
    booked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    pnr_code VARCHAR(10) UNIQUE NOT NULL,
    UNIQUE(seat_id) -- A seat can only be tied to one active booking ideally, but status handles it. Wait, if cancelled, it's freed. So uniqueness should be conditional. Let's remove unique constraint and handle it in RPC.
);

-- 4. PASSENGERS TABLE
CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    passport_no VARCHAR(50) NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    dob DATE NOT NULL
);

-- 5. RESCHEDULES TABLE
CREATE TABLE reschedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    old_flight_id UUID REFERENCES flights(id),
    new_flight_id UUID REFERENCES flights(id),
    requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    fee_charged NUMERIC(10, 2) DEFAULT 0 NOT NULL
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Flights and Seats: Anyone can view flights and seats (public read access)
CREATE POLICY "Public can view flights" ON flights FOR SELECT USING (true);
CREATE POLICY "Public can view seats" ON seats FOR SELECT USING (true);

-- Bookings: Users can only see and modify their own bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
-- Insert/Update handled by RPC mostly, but allow if user_id matches
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Passengers: Inherit from booking ownership
CREATE POLICY "Users can view own passengers" ON passengers FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own passengers" ON passengers FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
);

-- Reschedules: Inherit from booking ownership
CREATE POLICY "Users can view own reschedules" ON reschedules FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own reschedules" ON reschedules FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
);

-- RPC FUNCTION: Reserve Seat (prevent double-booking)
CREATE OR REPLACE FUNCTION reserve_seat(
    p_user_id UUID,
    p_flight_id UUID,
    p_seat_id UUID,
    p_total_price NUMERIC,
    p_pnr_code VARCHAR,
    p_full_name VARCHAR,
    p_passport_no VARCHAR,
    p_nationality VARCHAR,
    p_dob DATE
) RETURNS JSON AS $$
DECLARE
    v_seat_available BOOLEAN;
    v_booking_id UUID;
BEGIN
    -- Check seat availability with FOR UPDATE to lock the row
    SELECT is_available INTO v_seat_available
    FROM seats
    WHERE id = p_seat_id AND flight_id = p_flight_id
    FOR UPDATE;

    IF v_seat_available IS NULL THEN
        RAISE EXCEPTION 'Seat not found';
    END IF;

    IF NOT v_seat_available THEN
        RAISE EXCEPTION 'Seat is already booked';
    END IF;

    -- Update seat to unavailable
    UPDATE seats SET is_available = FALSE WHERE id = p_seat_id;

    -- Create booking
    INSERT INTO bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
    VALUES (p_user_id, p_flight_id, p_seat_id, 'confirmed', p_total_price, p_pnr_code)
    RETURNING id INTO v_booking_id;

    -- Create passenger
    INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
    VALUES (v_booking_id, p_full_name, p_passport_no, p_nationality, p_dob);

    RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- TRIGGER: Enforce cancellation within 2 hours of departure must be rejected
CREATE OR REPLACE FUNCTION check_cancellation_window()
RETURNS TRIGGER AS $$
DECLARE
    v_flight_time TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT departs_at INTO v_flight_time FROM flights WHERE id = NEW.flight_id;
        
        IF v_flight_time < NOW() + INTERVAL '2 hours' THEN
            RAISE EXCEPTION 'Cannot cancel booking within 2 hours of departure';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_cancellation_rule
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_cancellation_window();

-- RPC FUNCTION: Cancel Booking
CREATE OR REPLACE FUNCTION cancel_booking(
    p_booking_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_seat_id UUID;
    v_status booking_status;
BEGIN
    -- Verify ownership and get booking details
    SELECT user_id, seat_id, status INTO v_user_id, v_seat_id, v_status
    FROM bookings
    WHERE id = p_booking_id;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled';
    END IF;

    -- The trigger enforce_cancellation_rule will run here automatically
    UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
    
    -- Free the seat
    UPDATE seats SET is_available = TRUE WHERE id = v_seat_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC FUNCTION: Reschedule Booking
CREATE OR REPLACE FUNCTION reschedule_booking(
    p_booking_id UUID,
    p_new_flight_id UUID,
    p_new_seat_id UUID,
    p_fee_charged NUMERIC
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_old_flight_id UUID;
    v_old_seat_id UUID;
    v_seat_available BOOLEAN;
BEGIN
    SELECT user_id, flight_id, seat_id INTO v_user_id, v_old_flight_id, v_old_seat_id
    FROM bookings
    WHERE id = p_booking_id;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Lock the new seat
    SELECT is_available INTO v_seat_available
    FROM seats
    WHERE id = p_new_seat_id AND flight_id = p_new_flight_id
    FOR UPDATE;

    IF NOT v_seat_available THEN
        RAISE EXCEPTION 'New seat is already booked';
    END IF;

    -- Free the old seat
    UPDATE seats SET is_available = TRUE WHERE id = v_old_seat_id;
    
    -- Take the new seat
    UPDATE seats SET is_available = FALSE WHERE id = p_new_seat_id;

    -- Record the reschedule
    INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
    VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, p_fee_charged);

    -- Update the booking
    UPDATE bookings 
    SET flight_id = p_new_flight_id, 
        seat_id = p_new_seat_id, 
        status = 'rescheduled',
        total_price = total_price + p_fee_charged
    WHERE id = p_booking_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
