-- Migration: Create RADIUS clients table
-- Run this migration to add RADIUS clients management

CREATE TABLE IF NOT EXISTS radius_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ipaddr TEXT NOT NULL UNIQUE,
    secret TEXT NOT NULL,
    shortname TEXT,
    nas_type TEXT DEFAULT 'other',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default client for localhost (for testing)
INSERT OR IGNORE INTO radius_clients (name, ipaddr, secret, shortname, nas_type) VALUES
('localhost', '127.0.0.1', 'testing123', 'localhost', 'other');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_radius_clients_ipaddr ON radius_clients(ipaddr);
CREATE INDEX IF NOT EXISTS idx_radius_clients_active ON radius_clients(is_active);
