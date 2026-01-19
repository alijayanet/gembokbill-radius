-- Migration: Create voucher_purchases table for public voucher system
-- Date: 2025-01-27
-- Description: Create table for storing public voucher purchases and payment tracking

CREATE TABLE IF NOT EXISTS voucher_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'voucher',
    voucher_package TEXT NOT NULL,
    voucher_quantity INTEGER NOT NULL DEFAULT 1,
    voucher_profile TEXT NOT NULL,
    voucher_data TEXT, -- JSON data untuk menyimpan detail voucher yang digenerate
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_gateway TEXT,
    payment_transaction_id TEXT,
    payment_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_gateway_transactions(id)
);

-- Create index for phone number lookup
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_phone ON voucher_purchases(customer_phone);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_status ON voucher_purchases(status);

-- Create index for created_at for recent purchases
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_created ON voucher_purchases(created_at);

-- Create index for voucher_package for package-based queries
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_package ON voucher_purchases(voucher_package);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_voucher_purchases_updated_at
    AFTER UPDATE ON voucher_purchases
    FOR EACH ROW
BEGIN
    UPDATE voucher_purchases SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
