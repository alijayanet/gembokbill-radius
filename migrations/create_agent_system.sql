-- Migration: Create Agent System Tables
-- Date: 2025-01-27
-- Description: Create tables for agent system with balance, transactions, and voucher sales

-- Tabel Agent
CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Saldo Agent
CREATE TABLE IF NOT EXISTS agent_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Tabel Transaksi Agent
CREATE TABLE IF NOT EXISTS agent_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'voucher_sale', 'monthly_payment', 'commission', 'balance_request')),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_id TEXT, -- ID voucher, invoice, atau request
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Tabel Penjualan Voucher Agent
CREATE TABLE IF NOT EXISTS agent_voucher_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    voucher_code TEXT UNIQUE NOT NULL,
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_name TEXT,
    price DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME,
    notes TEXT,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Tabel Request Saldo Agent
CREATE TABLE IF NOT EXISTS agent_balance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    processed_by INTEGER,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Tabel Pembayaran Bulanan oleh Agent
CREATE TABLE IF NOT EXISTS agent_monthly_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    payment_amount DECIMAL(15,2) NOT NULL,
    commission_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Tabel Pembayaran Customer oleh Agent
CREATE TABLE IF NOT EXISTS agent_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Tabel Notifikasi Agent
CREATE TABLE IF NOT EXISTS agent_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('voucher_sold', 'payment_received', 'balance_updated', 'request_approved', 'request_rejected')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username);
CREATE INDEX IF NOT EXISTS idx_agents_phone ON agents(phone);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_balances_agent_id ON agent_balances(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_agent_id ON agent_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_type ON agent_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_created_at ON agent_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_voucher_sales_agent_id ON agent_voucher_sales(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_voucher_sales_code ON agent_voucher_sales(voucher_code);
CREATE INDEX IF NOT EXISTS idx_agent_voucher_sales_status ON agent_voucher_sales(status);
CREATE INDEX IF NOT EXISTS idx_agent_balance_requests_agent_id ON agent_balance_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_balance_requests_status ON agent_balance_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_payments_agent_id ON agent_payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_payments_customer_id ON agent_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_agent_payments_invoice_id ON agent_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON agent_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_is_read ON agent_notifications(is_read);

-- Triggers untuk update timestamp
CREATE TRIGGER IF NOT EXISTS update_agents_updated_at
    AFTER UPDATE ON agents
    FOR EACH ROW
BEGIN
    UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger dihapus karena menyebabkan infinite loop
-- last_updated sudah diupdate manual di setiap query UPDATE

-- Insert default agent untuk testing (password: agent123)
INSERT OR IGNORE INTO agents (username, name, phone, email, password, address, status, commission_rate) VALUES
('agent001', 'Agent Test', '081234567890', 'agent@test.com', '$2b$10$rQZ8K9mXvN3pL2sT1uY6eO7wE4rF5gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7a', 'Alamat Agent Test', 'active', 5.00);

-- Insert default balance untuk agent test
INSERT OR IGNORE INTO agent_balances (agent_id, balance) VALUES (1, 100000.00);

