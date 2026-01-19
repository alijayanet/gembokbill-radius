-- Migration: Create voucher_online_settings table for admin hotspot settings
-- Date: 2025-01-27
-- Description: Create table for storing voucher online settings (profile mapping and enable/disable)

CREATE TABLE IF NOT EXISTS voucher_online_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id TEXT NOT NULL UNIQUE,
    profile TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings for all packages
INSERT OR IGNORE INTO voucher_online_settings (package_id, profile, enabled) VALUES
('3k', '3k', 1),
('5k', '5k', 1),
('10k', '10k', 1),
('15k', '15k', 1),
('25k', '25k', 1),
('50k', '50k', 1);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_voucher_online_settings_package ON voucher_online_settings(package_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_voucher_online_settings_updated_at
    AFTER UPDATE ON voucher_online_settings
    FOR EACH ROW
BEGIN
    UPDATE voucher_online_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
