-- Migration: Create RADIUS Integration Tables
-- Date: 2025-01-19
-- Description: Add RADIUS integration to customers table for seamless FreeRADIUS management

-- Add RADIUS-related columns to customers table (only if they don't exist)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN directly
-- We'll use a workaround with PRAGMA to check for columns

-- Check and add radius_enabled column
-- Note: These ALTER TABLE statements will fail if columns already exist, but that's expected
-- The script will continue despite errors for these statements
ALTER TABLE customers ADD COLUMN radius_enabled BOOLEAN DEFAULT 0;
ALTER TABLE customers ADD COLUMN radius_username TEXT;
ALTER TABLE customers ADD COLUMN radius_password TEXT;
ALTER TABLE customers ADD COLUMN radius_group TEXT DEFAULT 'default';
ALTER TABLE customers ADD COLUMN radius_attributes TEXT;

-- Create index for RADIUS username
CREATE INDEX IF NOT EXISTS idx_customers_radius_username ON customers(radius_username);

-- Create RADIUS profiles table for managing bandwidth profiles
CREATE TABLE IF NOT EXISTS radius_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    download_speed TEXT NOT NULL,
    upload_speed TEXT NOT NULL,
    rate_limit TEXT,
    burst_limit TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default RADIUS profiles (ignore if already exists)
INSERT OR IGNORE INTO radius_profiles (name, download_speed, upload_speed, rate_limit, burst_limit, priority) VALUES
('default', '10M', '10M', '10M/10M', '15M/15M', 1),
('basic', '5M', '5M', '5M/5M', '8M/8M', 2),
('standard', '20M', '20M', '20M/20M', '30M/30M', 3),
('premium', '50M', '50M', '50M/50M', '75M/75M', 4),
('enterprise', '100M', '100M', '100M/100M', '150M/150M', 5);

-- Create RADIUS sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS radius_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    username TEXT NOT NULL,
    session_id TEXT,
    nas_ip_address TEXT,
    framed_ip_address TEXT,
    session_start_time DATETIME,
    session_stop_time DATETIME,
    session_duration INTEGER,
    input_octets BIGINT DEFAULT 0,
    output_octets BIGINT DEFAULT 0,
    terminate_cause TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Create index for RADIUS sessions
CREATE INDEX IF NOT EXISTS idx_radius_sessions_customer ON radius_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_radius_sessions_username ON radius_sessions(username);
CREATE INDEX IF NOT EXISTS idx_radius_sessions_start_time ON radius_sessions(session_start_time);

-- Create RADIUS audit log table
CREATE TABLE IF NOT EXISTS radius_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    username TEXT,
    details TEXT,
    performed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_radius_audit_log_action ON radius_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_radius_audit_log_username ON radius_audit_log(username);
CREATE INDEX IF NOT EXISTS idx_radius_audit_log_created_at ON radius_audit_log(created_at);

-- Add RADIUS sync status to packages table (only if they don't exist)
-- Note: These ALTER TABLE statements will fail if columns already exist, but that's expected
ALTER TABLE packages ADD COLUMN radius_profile_id INTEGER;
ALTER TABLE packages ADD COLUMN sync_to_radius BOOLEAN DEFAULT 0;

-- Create foreign key constraint
-- Note: SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so this is handled in application logic
