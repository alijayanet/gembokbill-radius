-- Migration: Create monthly_summary table for storing monthly billing summaries
-- Date: 2025-01-27
-- Description: Create table for storing monthly billing summaries that are reset each month

CREATE TABLE IF NOT EXISTS monthly_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_customers INTEGER DEFAULT 0,
    active_customers INTEGER DEFAULT 0,
    monthly_invoices INTEGER DEFAULT 0,
    voucher_invoices INTEGER DEFAULT 0,
    paid_monthly_invoices INTEGER DEFAULT 0,
    paid_voucher_invoices INTEGER DEFAULT 0,
    unpaid_monthly_invoices INTEGER DEFAULT 0,
    unpaid_voucher_invoices INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(15,2) DEFAULT 0,
    voucher_revenue DECIMAL(15,2) DEFAULT 0,
    monthly_unpaid DECIMAL(15,2) DEFAULT 0,
    voucher_unpaid DECIMAL(15,2) DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_unpaid DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_summary_year_month ON monthly_summary(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_created_at ON monthly_summary(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_monthly_summary_updated_at
    AFTER UPDATE ON monthly_summary
    FOR EACH ROW
BEGIN
    UPDATE monthly_summary SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
