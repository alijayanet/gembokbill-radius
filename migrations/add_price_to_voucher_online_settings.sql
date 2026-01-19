-- Migration: Add price column to voucher_online_settings table
-- Date: 2025-10-21
-- Description: Add price column to store voucher prices in voucher_online_settings table

-- Add price column to voucher_online_settings table
ALTER TABLE voucher_online_settings ADD COLUMN price INTEGER DEFAULT 0;

-- Update existing records with default prices
UPDATE voucher_online_settings 
SET price = CASE package_id
    WHEN '3k' THEN 3000
    WHEN '5k' THEN 5000
    WHEN '10k' THEN 10000
    WHEN '15k' THEN 15000
    WHEN '25k' THEN 25000
    WHEN '50k' THEN 50000
    ELSE 0
END;