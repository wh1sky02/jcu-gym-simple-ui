-- JCU Gym Management System - Neon Database Schema
-- This file contains the complete database schema for the Neon cloud database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    membership_type TEXT DEFAULT 'basic' CHECK (membership_type IN ('basic', 'premium', '1-trimester', '3-trimester')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'expired')),
    phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_date TIMESTAMP WITH TIME ZONE,
    expiry_date DATE,
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    total_workouts INTEGER DEFAULT 0,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT,
    billing_address TEXT
);

-- Gym sessions table
CREATE TABLE IF NOT EXISTS gym_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    current_bookings INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    type TEXT DEFAULT 'general',
    instructor TEXT,
    description TEXT,
    difficulty TEXT,
    waitlist_count INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES gym_sessions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no-show', 'completed')),
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for global notifications
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing transactions table
CREATE TABLE IF NOT EXISTS billing_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'SGD',
    description TEXT,
    transaction_type TEXT CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON gym_sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON gym_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON billing_transactions(user_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON gym_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update session booking count
CREATE OR REPLACE FUNCTION update_session_booking_count(session_id UUID, increment_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE gym_sessions 
    SET current_bookings = current_bookings + increment_amount,
        updated_at = NOW()
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(
    total_bookings INTEGER,
    completed_workouts INTEGER,
    current_streak INTEGER,
    total_points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(b.id)::INTEGER as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::INTEGER as completed_workouts,
        u.streak as current_streak,
        u.points as total_points
    FROM users u
    LEFT JOIN bookings b ON u.id = b.user_id
    WHERE u.id = user_id
    GROUP BY u.streak, u.points;
END;
$$ LANGUAGE plpgsql;

-- Function to get session statistics
CREATE OR REPLACE FUNCTION get_session_stats(session_id UUID)
RETURNS TABLE(
    total_bookings INTEGER,
    confirmed_bookings INTEGER,
    cancelled_bookings INTEGER,
    no_show_bookings INTEGER,
    average_rating DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(b.id)::INTEGER as total_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END)::INTEGER as confirmed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END)::INTEGER as cancelled_bookings,
        COUNT(CASE WHEN b.status = 'no-show' THEN 1 END)::INTEGER as no_show_bookings,
        AVG(b.rating) as average_rating
    FROM gym_sessions s
    LEFT JOIN bookings b ON s.id = b.session_id
    WHERE s.id = session_id
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql; 