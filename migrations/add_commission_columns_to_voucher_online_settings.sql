-- Migration: Add commission columns to voucher_online_settings table
-- Date: 2025-10-13
-- Description: Add commission-related columns to voucher_online_settings table

-- Add commission-related columns to voucher_online_settings table
ALTER TABLE voucher_online_settings ADD COLUMN agent_price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE voucher_online_settings ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE voucher_online_settings ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Update existing records with default values
UPDATE voucher_online_settings 
SET agent_price = CASE package_id
    WHEN '3k' THEN 2400
    WHEN '5k' THEN 4000
    WHEN '10k' THEN 8000
    WHEN '15k' THEN 12000
    WHEN '25k' THEN 20000
    WHEN '50k' THEN 40000
    ELSE 0
END;

UPDATE voucher_online_settings 
SET commission_amount = CASE package_id
    WHEN '3k' THEN 600
    WHEN '5k' THEN 1000
    WHEN '10k' THEN 2000
    WHEN '15k' THEN 3000
    WHEN '25k' THEN 5000
    WHEN '50k' THEN 10000
    ELSE 0
END;

-- Set all packages as active by default
UPDATE voucher_online_settings 
SET is_active = 1;