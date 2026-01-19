-- Migration: Create technicians table
-- Date: 2024-01-01
-- Description: Create table for managing technicians with OTP login support

CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('technician', 'field_officer', 'collector')),
    email TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    area_coverage TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Create index for phone number lookup
CREATE INDEX IF NOT EXISTS idx_technicians_phone ON technicians(phone);

-- Create index for active technicians
CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(is_active);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_technicians_role ON technicians(role);

-- Create technician_sessions table for session management
CREATE TABLE IF NOT EXISTS technician_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    technician_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
);

-- Create index for session lookup
CREATE INDEX IF NOT EXISTS idx_technician_sessions_id ON technician_sessions(session_id);

-- Create index for expired sessions cleanup
CREATE INDEX IF NOT EXISTS idx_technician_sessions_expires ON technician_sessions(expires_at);

-- Create technician_activities table for activity logging
CREATE TABLE IF NOT EXISTS technician_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    technician_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
);

-- Create index for activity queries
CREATE INDEX IF NOT EXISTS idx_technician_activities_technician ON technician_activities(technician_id);

-- Create index for activity type queries
CREATE INDEX IF NOT EXISTS idx_technician_activities_type ON technician_activities(activity_type);

-- Insert sample technician data (optional)
INSERT OR IGNORE INTO technicians (name, phone, role, email, notes, is_active) VALUES 
('Teknisi Demo', '08123456789', 'technician', 'demo@example.com', 'Teknisi untuk testing', 1),
('Field Officer Demo', '08123456788', 'field_officer', 'fo@example.com', 'Field Officer untuk testing', 1),
('Kolektor Demo', '08123456787', 'collector', 'collector@example.com', 'Kolektor untuk testing', 1);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_technicians_updated_at 
    AFTER UPDATE ON technicians
    FOR EACH ROW
BEGIN
    UPDATE technicians SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
