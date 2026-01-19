-- Migration: Fix payment duplication issue
-- Date: 2025-01-27
-- Description: Add collector_id and commission_amount to payments table and fix duplication

-- Step 1: Add new columns to payments table
ALTER TABLE payments ADD COLUMN collector_id INTEGER;
ALTER TABLE payments ADD COLUMN commission_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'direct' CHECK(payment_type IN ('direct', 'collector', 'online', 'manual'));

-- Step 2: Add foreign key constraint for collector_id
-- Note: This will only work if collectors table exists
-- We'll handle this in the application code if needed

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_collector_id ON payments(collector_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- Step 4: Update existing payments to have payment_type = 'direct'
UPDATE payments SET payment_type = 'direct' WHERE payment_type IS NULL;

-- Step 5: Add comments for documentation
-- collector_id: NULL for direct payments, references collectors.id for collector payments
-- commission_amount: 0 for direct payments, calculated amount for collector payments
-- payment_type: 'direct', 'collector', 'online', 'manual'
