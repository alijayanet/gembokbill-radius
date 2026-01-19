-- Create voucher pricing system with nominal commission

-- Create table for voucher pricing management
CREATE TABLE IF NOT EXISTS voucher_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_name TEXT NOT NULL,
    customer_price DECIMAL(10,2) NOT NULL,
    agent_price DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    duration INTEGER DEFAULT 0, -- in hours
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing data
INSERT INTO voucher_pricing (package_name, customer_price, agent_price, commission_amount, duration, description, is_active) VALUES
('3K', 3000, 2000, 1000, 24, 'Voucher 3K - 24 jam', 1),
('5K', 5000, 3500, 1500, 24, 'Voucher 5K - 24 jam', 1),
('10K', 10000, 8000, 2000, 24, 'Voucher 10K - 24 jam', 1),
('20K', 20000, 16000, 4000, 24, 'Voucher 20K - 24 jam', 1),
('50K', 50000, 40000, 10000, 24, 'Voucher 50K - 24 jam', 1);

-- Update agent_voucher_sales to use new commission system
ALTER TABLE agent_voucher_sales ADD COLUMN agent_price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE agent_voucher_sales ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0.00;

-- Update existing records (if any)
UPDATE agent_voucher_sales 
SET agent_price = price * 0.8,
    commission_amount = price * 0.2
WHERE agent_price = 0.00;

-- Add duration columns to voucher_online_settings table
ALTER TABLE voucher_online_settings ADD COLUMN duration INTEGER DEFAULT 24;
ALTER TABLE voucher_online_settings ADD COLUMN duration_type TEXT DEFAULT 'hours';