-- Migration: Cleanup Legacy Columns
-- Date: 2025-01-27
-- Description: Remove legacy columns and improve data integrity

-- 1. Backup existing data before cleanup
-- Note: Kolom 'amount' di collector_payments adalah duplikat dari payment_amount
-- Sebelum menghapus, pastikan tidak ada data yang berbeda

-- 2. Check for data inconsistencies
-- Query untuk mengecek apakah ada perbedaan antara amount dan payment_amount
SELECT 
    id, 
    amount, 
    payment_amount,
    (amount - payment_amount) as difference
FROM collector_payments 
WHERE amount != payment_amount;

-- 3. Update any inconsistent data (amount should equal payment_amount)
UPDATE collector_payments 
SET amount = payment_amount 
WHERE amount != payment_amount;

-- 4. Remove legacy amount column (uncomment when ready)
-- ALTER TABLE collector_payments DROP COLUMN amount;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collector_payments_collector_id ON collector_payments(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_payments_customer_id ON collector_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_collector_payments_payment_date ON collector_payments(collected_at);

-- Note: SQLite doesn't support adding CHECK constraints to existing tables
-- These constraints should be implemented in application logic or when creating new tables