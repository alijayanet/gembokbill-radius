-- Migration: Create voucher_generation_settings table for admin hotspot voucher generation settings
-- Date: 2025-10-13
-- Description: Create table for storing voucher generation settings

CREATE TABLE IF NOT EXISTS voucher_generation_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO voucher_generation_settings (setting_key, setting_value) VALUES
('username_length', '4'),
('password_length', '6'),
('char_type', 'alphanumeric'),
('username_format', 'V{timestamp}'),
('account_type', 'voucher'),
('password_length_separate', '6');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_voucher_generation_settings_key ON voucher_generation_settings(setting_key);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_voucher_generation_settings_updated_at
    AFTER UPDATE ON voucher_generation_settings
    FOR EACH ROW
BEGIN
    UPDATE voucher_generation_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;