-- Migration: Add invoice_id column to voucher_purchases table
-- Date: 2025-01-27
-- Description: Add invoice_id column for linking voucher purchases to invoices

ALTER TABLE voucher_purchases ADD COLUMN invoice_id TEXT;

-- Create index for invoice_id for faster queries
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_invoice_id ON voucher_purchases(invoice_id);
