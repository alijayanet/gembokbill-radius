-- Migration: Add digits column to voucher_online_settings table
-- Date: 2025-10-21
-- Description: Add digits column to store voucher code length in voucher_online_settings table

-- Add digits column to voucher_online_settings table
ALTER TABLE voucher_online_settings ADD COLUMN digits INTEGER DEFAULT 5;

-- Update existing records with default digits value
UPDATE voucher_online_settings 
SET digits = 5
WHERE digits IS NULL;