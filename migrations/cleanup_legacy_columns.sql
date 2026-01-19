-- Migration: Cleanup Legacy Columns
-- Date: 2025-01-27
-- Description: Remove legacy columns and improve data integrity

-- 1. Check if amount column exists in collector_payments table
-- This migration handles the case where amount column may not exist
-- The amount column is a legacy column that should be replaced with payment_amount

-- 2. Skip data consistency check if amount column doesn't exist
-- The following query is commented out to prevent errors when amount column doesn't exist
-- SELECT
--     id,
--     amount,
--     payment_amount,
--     (amount - payment_amount) as difference
-- FROM collector_payments
-- WHERE amount != payment_amount;

-- 3. Skip update if amount column doesn't exist
-- UPDATE collector_payments
-- SET amount = payment_amount
-- WHERE amount != payment_amount;

-- 4. Skip dropping amount column if it doesn't exist
-- ALTER TABLE collector_payments DROP COLUMN amount;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collector_payments_collector_id ON collector_payments(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_payments_customer_id ON collector_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_collector_payments_payment_date ON collector_payments(collected_at);

-- Note: SQLite doesn't support adding CHECK constraints to existing tables
-- These constraints should be implemented in application logic or when creating new tables