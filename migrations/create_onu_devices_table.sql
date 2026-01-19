-- Migration: Create ONU Devices Table
-- Description: Creates the onu_devices table for storing ONU device information

CREATE TABLE IF NOT EXISTS onu_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    mac_address VARCHAR(17),
    ip_address VARCHAR(15),
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    customer_id INTEGER,
    odp_id INTEGER,
    ssid VARCHAR(50),
    password VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (odp_id) REFERENCES odps(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onu_devices_customer_id ON onu_devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_onu_devices_odp_id ON onu_devices(odp_id);
CREATE INDEX IF NOT EXISTS idx_onu_devices_status ON onu_devices(status);
CREATE INDEX IF NOT EXISTS idx_onu_devices_coordinates ON onu_devices(latitude, longitude);

-- Insert sample ONU devices for testing
INSERT OR IGNORE INTO onu_devices (
    name, serial_number, mac_address, ip_address, status, 
    latitude, longitude, customer_id, odp_id, ssid, password, model
) VALUES 
('ONU-001', 'SN123456789', '00:11:22:33:44:55', '192.168.1.100', 'online', 
 -6.25300618, 107.92300909, 1, 1, 'GEMBOK-WIFI-001', 'password123', 'HG8245H5'),
('ONU-002', 'SN987654321', '00:11:22:33:44:66', '192.168.1.101', 'online', 
 -6.25250000, 107.92250000, NULL, 1, 'GEMBOK-WIFI-002', 'password456', 'HG8245H5'),
('ONU-003', 'SN555666777', '00:11:22:33:44:77', '192.168.1.102', 'offline', 
 -6.25350000, 107.92350000, NULL, 2, 'GEMBOK-WIFI-003', 'password789', 'HG8245H5');
