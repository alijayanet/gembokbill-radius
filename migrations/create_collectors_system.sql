-- Migration: Create collectors system for mobile payment collection
-- Date: 2025-01-27
-- Description: Create tables for collectors and collector payments

-- Table: collectors (tukang tagih)
CREATE TABLE IF NOT EXISTS collectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    commission_rate DECIMAL(5,2) DEFAULT 5.00, -- Commission percentage
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: collector_payments (pembayaran melalui tukang tagih)
CREATE TABLE IF NOT EXISTS collector_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collector_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    payment_amount DECIMAL(15,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'transfer', 'other')),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collector_id) REFERENCES collectors(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Table: collector_assignments (penugasan tukang tagih ke pelanggan)
CREATE TABLE IF NOT EXISTS collector_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collector_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collector_id) REFERENCES collectors(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    UNIQUE(collector_id, customer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collectors_phone ON collectors(phone);
CREATE INDEX IF NOT EXISTS idx_collectors_status ON collectors(status);
CREATE INDEX IF NOT EXISTS idx_collector_payments_collector_id ON collector_payments(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_payments_customer_id ON collector_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_collector_payments_invoice_id ON collector_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_collector_payments_payment_date ON collector_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_collector_assignments_collector_id ON collector_assignments(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_assignments_customer_id ON collector_assignments(customer_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_collectors_updated_at
    AFTER UPDATE ON collectors
    FOR EACH ROW
BEGIN
    UPDATE collectors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_collector_payments_updated_at
    AFTER UPDATE ON collector_payments
    FOR EACH ROW
BEGIN
    UPDATE collector_payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_collector_assignments_updated_at
    AFTER UPDATE ON collector_assignments
    FOR EACH ROW
BEGIN
    UPDATE collector_assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert sample collectors
INSERT OR IGNORE INTO collectors (name, phone, email, address, commission_rate) VALUES
('Ahmad Suryadi', '081234567890', 'ahmad@example.com', 'Jl. Merdeka No. 123, Jakarta', 5.00),
('Budi Santoso', '081234567891', 'budi@example.com', 'Jl. Sudirman No. 456, Jakarta', 5.00),
('Citra Dewi', '081234567892', 'citra@example.com', 'Jl. Thamrin No. 789, Jakarta', 5.00);
