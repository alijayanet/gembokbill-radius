-- Migration: Add missing columns to voucher_pricing table
-- Date: 2025-10-21
-- Description: Add duration_type, account_type, voucher_digit_type, and voucher_length columns to voucher_pricing table

-- Add duration_type column
ALTER TABLE voucher_pricing ADD COLUMN duration_type TEXT DEFAULT 'hours';

-- Add account_type column
ALTER TABLE voucher_pricing ADD COLUMN account_type TEXT DEFAULT 'voucher';

-- Add voucher_digit_type column
ALTER TABLE voucher_pricing ADD COLUMN voucher_digit_type TEXT DEFAULT 'mixed';

-- Add voucher_length column
ALTER TABLE voucher_pricing ADD COLUMN voucher_length INTEGER DEFAULT 8;

-- Update existing records with default values
UPDATE voucher_pricing 
SET duration_type = 'hours', 
    account_type = 'voucher', 
    voucher_digit_type = 'mixed', 
    voucher_length = 8 
WHERE duration_type IS NULL;

-- Update specific packages with appropriate values
UPDATE voucher_pricing 
SET duration = 1, 
    duration_type = 'days', 
    voucher_digit_type = 'numbers', 
    voucher_length = 5,
    description = 'Voucher ' || package_name || ' - 1 hari'
WHERE package_name = '3K';

UPDATE voucher_pricing 
SET duration = 2, 
    duration_type = 'days', 
    voucher_digit_type = 'numbers', 
    voucher_length = 5,
    description = 'Voucher ' || package_name || ' - 2 hari'
WHERE package_name = '5K';

UPDATE voucher_pricing 
SET duration = 5, 
    duration_type = 'days', 
    voucher_digit_type = 'numbers', 
    voucher_length = 5,
    description = 'Voucher ' || package_name || ' - 5 hari'
WHERE package_name = '10K';

UPDATE voucher_pricing 
SET duration = 24, 
    duration_type = 'hours', 
    voucher_digit_type = 'mixed', 
    voucher_length = 8,
    description = 'Voucher ' || package_name || ' - 24 jam'
WHERE package_name IN ('20K', '50K');