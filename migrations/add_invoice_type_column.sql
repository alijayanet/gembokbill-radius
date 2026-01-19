-- Migration: Add invoice_type column to invoices table
-- Date: 2025-01-27
-- Description: Add invoice_type column to separate voucher invoices from monthly customer invoices

-- Add invoice_type column
ALTER TABLE invoices ADD COLUMN invoice_type TEXT DEFAULT 'monthly' CHECK (invoice_type IN ('monthly', 'voucher', 'manual'));

-- Create index for invoice_type for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);

-- Update existing voucher invoices to have invoice_type = 'voucher'
UPDATE invoices 
SET invoice_type = 'voucher' 
WHERE invoice_number LIKE 'INV-VCR-%' OR notes LIKE 'Voucher Hotspot%';

-- Update existing manual invoices to have invoice_type = 'manual' (if any)
UPDATE invoices 
SET invoice_type = 'manual' 
WHERE invoice_type IS NULL AND notes LIKE '%Manual%';

-- Ensure all remaining invoices are marked as 'monthly'
UPDATE invoices 
SET invoice_type = 'monthly' 
WHERE invoice_type IS NULL;
