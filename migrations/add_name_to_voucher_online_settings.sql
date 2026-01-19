-- Migration: Add name column to voucher_online_settings table
-- Date: 2025-10-21
-- Description: Add name column to store voucher package names in voucher_online_settings table

-- Add name column to voucher_online_settings table
ALTER TABLE voucher_online_settings ADD COLUMN name TEXT;

-- Update existing records with default names based on package_id
UPDATE voucher_online_settings 
SET name = CASE package_id
    WHEN '3k' THEN '3rb - 1 Hari'
    WHEN '5k' THEN '5rb - 2 Hari'
    WHEN '10k' THEN '10rb - 5 Hari'
    WHEN '15k' THEN '15rb - 8 Hari'
    WHEN '25k' THEN '25rb - 15 Hari'
    WHEN '50k' THEN '50rb - 30 Hari'
    ELSE package_id || ' - Paket'
END
WHERE name IS NULL;