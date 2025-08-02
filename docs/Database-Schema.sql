-- CleanConnect Database Schema
-- PostgreSQL 15+ with Supabase extensions
-- Version: 1.0
-- Last Updated: August 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom Types and Enums
CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE service_category AS ENUM ('standard', 'deep', 'move_in', 'move_out', 'add_on');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE recurring_frequency AS ENUM ('weekly', 'bi_weekly', 'monthly');
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account');
CREATE TYPE transaction_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'review', 'system');

-- Core Tables

-- Users and Authentication (managed by Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Profiles
CREATE TABLE customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    avatar_url TEXT,
    emergency_contact JSONB,
    preferences JSONB DEFAULT '{}',
    total_bookings INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Provider Profiles
CREATE TABLE provider_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(8,2),
    service_radius INTEGER DEFAULT 25, -- miles
    verification_status verification_status DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    insurance_expires_at DATE,
    background_check_expires_at DATE,
    availability JSONB DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    response_time_minutes INTEGER DEFAULT 60,
    cancellation_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    street_address VARCHAR(255) NOT NULL,
    apartment VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services Catalog
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(8,2) NOT NULL,
    price_per_sqft DECIMAL(6,4) DEFAULT 0,
    duration_minutes INTEGER NOT NULL,
    category service_category NOT NULL,
    features TEXT[],
    requirements TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Add-ons
CREATE TABLE service_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Bookings
CREATE TABLE recurring_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID REFERENCES users(id),
    address_id UUID NOT NULL REFERENCES addresses(id),
    frequency recurring_frequency NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    preferred_time TIME,
    preferred_day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    next_booking_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID REFERENCES users(id),
    address_id UUID NOT NULL REFERENCES addresses(id),
    service_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status booking_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    processing_fee DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    home_details JSONB DEFAULT '{}', -- bedrooms, bathrooms, sqft, etc.
    recurring_booking_id UUID REFERENCES recurring_bookings(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking Items (Services within a booking)
CREATE TABLE booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    addon_id UUID REFERENCES service_addons(id),
    name VARCHAR(100) NOT NULL, -- Snapshot of service/addon name
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    type payment_method_type NOT NULL,
    last_four VARCHAR(4),
    brand VARCHAR(50),
    exp_month INTEGER,
    exp_year INTEGER,
    billing_address JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    processing_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL, -- Amount to provider
    status transaction_status DEFAULT 'pending',
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    transaction_count INTEGER NOT NULL,
    stripe_transfer_id VARCHAR(255),
    status payout_status DEFAULT 'pending',
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos TEXT[], -- Array of image URLs
    response TEXT, -- Response from reviewee
    response_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    attachments TEXT[], -- Array of file URLs
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_bookings_customer_date ON bookings(customer_id, service_date);
CREATE INDEX idx_bookings_provider_date ON bookings(provider_id, service_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_service_date ON bookings(service_date);
CREATE INDEX idx_addresses_user_default ON addresses(user_id, is_default);
CREATE INDEX idx_reviews_reviewee_rating ON reviews(reviewee_id, rating);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_messages_booking_sent ON messages(booking_id, sent_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX idx_payouts_provider_period ON payouts(provider_id, period_start, period_end);

-- Geospatial Index for location-based queries
CREATE INDEX idx_addresses_location ON addresses USING GIST(
    ll_to_earth(latitude, longitude)
);

-- Full-text search indexes
CREATE INDEX idx_providers_search ON provider_profiles USING GIN(
    to_tsvector('english', business_name || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_services_search ON services USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Users can only access their own data)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own addresses" ON addresses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "Customers can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Sample Data Inserts
INSERT INTO services (name, description, base_price, price_per_sqft, duration_minutes, category, features) VALUES
('Standard Cleaning', 'Regular house cleaning including all rooms', 80.00, 0.10, 120, 'standard', 
 ARRAY['Vacuum all floors', 'Dust surfaces', 'Clean bathrooms', 'Kitchen cleaning', 'Trash removal']),
('Deep Cleaning', 'Thorough cleaning including baseboards, inside appliances', 150.00, 0.15, 240, 'deep',
 ARRAY['Everything in standard', 'Baseboards', 'Inside oven', 'Inside refrigerator', 'Light fixtures']),
('Move-in Cleaning', 'Complete cleaning for new residence', 200.00, 0.20, 300, 'move_in',
 ARRAY['Deep clean all areas', 'Cabinet interiors', 'Appliance deep clean', 'Window sills']);

INSERT INTO service_addons (name, description, price, duration_minutes) VALUES
('Inside Oven', 'Deep clean inside of oven', 25.00, 30),
('Inside Refrigerator', 'Clean inside of refrigerator', 20.00, 20),
('Garage Cleaning', 'Sweep and organize garage', 40.00, 60),
('Basement Cleaning', 'Clean basement area', 35.00, 45);

-- Views for common queries
CREATE VIEW booking_details AS
SELECT 
    b.id,
    b.service_date,
    b.status,
    b.total_amount,
    cp.first_name || ' ' || cp.last_name AS customer_name,
    cp.user_id AS customer_id,
    pp.business_name AS provider_name,
    pp.user_id AS provider_id,
    a.street_address || ', ' || a.city || ', ' || a.state AS full_address,
    array_agg(bi.name) AS services
FROM bookings b
JOIN customer_profiles cp ON b.customer_id = cp.user_id
LEFT JOIN provider_profiles pp ON b.provider_id = pp.user_id
JOIN addresses a ON b.address_id = a.id
LEFT JOIN booking_items bi ON b.id = bi.booking_id
GROUP BY b.id, cp.first_name, cp.last_name, cp.user_id, pp.business_name, pp.user_id, a.street_address, a.city, a.state;

-- Functions for business logic
CREATE OR REPLACE FUNCTION calculate_commission(booking_amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(booking_amount * 0.18, 2); -- 18% commission
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_processing_fee(booking_amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(booking_amount * 0.029 + 0.30, 2); -- Stripe fees
END;
$$ LANGUAGE plpgsql;
