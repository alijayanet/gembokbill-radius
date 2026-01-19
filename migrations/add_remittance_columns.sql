-- Migration: Add remittance columns to payments table
-- Date: 2025-01-27
-- Description: Add remittance tracking columns to payments table for collector remittance system

-- Add remittance columns to payments table
ALTER TABLE payments ADD COLUMN remittance_status TEXT CHECK(remittance_status IN ('pending', 'remitted', 'cancelled'));
ALTER TABLE payments ADD COLUMN remittance_date DATETIME;
ALTER TABLE payments ADD COLUMN remittance_notes TEXT;

-- Create index for remittance queries
CREATE INDEX IF NOT EXISTS idx_payments_remittance_status ON payments(remittance_status);
CREATE INDEX IF NOT EXISTS idx_payments_remittance_date ON payments(remittance_date);

-- Update existing collector payments to have remittance_status = 'pending'
UPDATE payments 
SET remittance_status = 'pending' 
WHERE payment_type = 'collector' AND remittance_status IS NULL;
