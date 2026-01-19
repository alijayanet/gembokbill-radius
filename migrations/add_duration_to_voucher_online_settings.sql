-- Add duration columns to voucher_online_settings table
ALTER TABLE voucher_online_settings ADD COLUMN duration INTEGER DEFAULT 24;
ALTER TABLE voucher_online_settings ADD COLUMN duration_type TEXT DEFAULT 'hours';