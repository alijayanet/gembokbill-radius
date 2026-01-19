-- Migration: Add package_name column to invoices table
-- Date: 2025-01-27
-- Description: Add package_name column for storing package names in invoices

ALTER TABLE invoices ADD COLUMN package_name TEXT NULL;

-- Create index for package_name for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_package_name ON invoices(package_name);
