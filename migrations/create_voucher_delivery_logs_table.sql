-- Migration: Create voucher_delivery_logs table
-- Date: 2025-01-27
-- Description: Create table for tracking voucher delivery status via WhatsApp

CREATE TABLE IF NOT EXISTS voucher_delivery_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'error')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES voucher_purchases (id) ON DELETE CASCADE
);

-- Create index for purchase_id lookup
CREATE INDEX IF NOT EXISTS idx_voucher_delivery_logs_purchase_id ON voucher_delivery_logs(purchase_id);

-- Create index for status lookup
CREATE INDEX IF NOT EXISTS idx_voucher_delivery_logs_status ON voucher_delivery_logs(status);

-- Create index for created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_voucher_delivery_logs_created_at ON voucher_delivery_logs(created_at);
