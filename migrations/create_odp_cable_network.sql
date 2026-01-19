-- Migration: Create ODP and Cable Network tables
-- Date: 2025-01-27
-- Description: Create tables for managing ODP (Optical Distribution Point) and cable routes
-- Author: AI Assistant

-- Tabel ODP (Optical Distribution Point)
CREATE TABLE IF NOT EXISTS odps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_odp_id INTEGER, -- Untuk sub ODP (hierarki ODP)
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    address TEXT,
    capacity INTEGER DEFAULT 64,
    used_ports INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    installation_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_odp_id) REFERENCES odps(id) ON DELETE SET NULL
);

-- Tabel Cable Routes (Jalur Kabel dari ODP ke Pelanggan)
CREATE TABLE IF NOT EXISTS cable_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    odp_id INTEGER NOT NULL,
    cable_length DECIMAL(8,2), -- dalam meter
    cable_type VARCHAR(50) DEFAULT 'Fiber Optic',
    installation_date DATE,
    status VARCHAR(20) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'maintenance', 'damaged')),
    port_number INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (odp_id) REFERENCES odps(id) ON DELETE CASCADE
);

-- Tabel Network Segments (Segmen Jaringan)
CREATE TABLE IF NOT EXISTS network_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    start_odp_id INTEGER NOT NULL,
    end_odp_id INTEGER,
    segment_type VARCHAR(50) DEFAULT 'Backbone' CHECK (segment_type IN ('Backbone', 'Distribution', 'Access')),
    cable_length DECIMAL(10,2), -- dalam meter
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'damaged', 'inactive')),
    installation_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (start_odp_id) REFERENCES odps(id) ON DELETE CASCADE,
    FOREIGN KEY (end_odp_id) REFERENCES odps(id) ON DELETE CASCADE
);

-- Tabel Cable Maintenance Log
CREATE TABLE IF NOT EXISTS cable_maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cable_route_id INTEGER,
    network_segment_id INTEGER,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('repair', 'replacement', 'inspection', 'upgrade')),
    description TEXT NOT NULL,
    performed_by INTEGER, -- technician_id
    maintenance_date DATE NOT NULL,
    duration_hours DECIMAL(4,2),
    cost DECIMAL(12,2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cable_route_id) REFERENCES cable_routes(id) ON DELETE CASCADE,
    FOREIGN KEY (network_segment_id) REFERENCES network_segments(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES technicians(id) ON DELETE SET NULL
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_odps_location ON odps(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_odps_status ON odps(status);
CREATE INDEX IF NOT EXISTS idx_cable_routes_customer ON cable_routes(customer_id);
CREATE INDEX IF NOT EXISTS idx_cable_routes_odp ON cable_routes(odp_id);
CREATE INDEX IF NOT EXISTS idx_cable_routes_status ON cable_routes(status);
CREATE INDEX IF NOT EXISTS idx_network_segments_start ON network_segments(start_odp_id);
CREATE INDEX IF NOT EXISTS idx_network_segments_end ON network_segments(end_odp_id);
CREATE INDEX IF NOT EXISTS idx_network_segments_status ON network_segments(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_route ON cable_maintenance_logs(cable_route_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_segment ON cable_maintenance_logs(network_segment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON cable_maintenance_logs(maintenance_date);

-- Triggers untuk update timestamp
CREATE TRIGGER IF NOT EXISTS update_odps_updated_at 
    AFTER UPDATE ON odps
    FOR EACH ROW
BEGIN
    UPDATE odps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_cable_routes_updated_at 
    AFTER UPDATE ON cable_routes
    FOR EACH ROW
BEGIN
    UPDATE cable_routes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_network_segments_updated_at 
    AFTER UPDATE ON network_segments
    FOR EACH ROW
BEGIN
    UPDATE network_segments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger untuk update used_ports di ODP
CREATE TRIGGER IF NOT EXISTS update_odp_used_ports_insert
    AFTER INSERT ON cable_routes
    FOR EACH ROW
BEGIN
    UPDATE odps SET used_ports = used_ports + 1 WHERE id = NEW.odp_id;
END;

CREATE TRIGGER IF NOT EXISTS update_odp_used_ports_delete
    AFTER DELETE ON cable_routes
    FOR EACH ROW
BEGIN
    UPDATE odps SET used_ports = used_ports - 1 WHERE id = OLD.odp_id;
END;

-- Sample data untuk testing (opsional)
INSERT OR IGNORE INTO odps (name, code, latitude, longitude, address, capacity, status) VALUES 
('ODP-Central-01', 'ODP-C01', -6.2088, 106.8456, 'Jl. Sudirman No. 1, Jakarta Pusat', 64, 'active'),
('ODP-Branch-01', 'ODP-B01', -6.2200, 106.8500, 'Jl. Thamrin No. 10, Jakarta Pusat', 32, 'active'),
('ODP-Residential-01', 'ODP-R01', -6.2000, 106.8400, 'Jl. Kebon Jeruk No. 5, Jakarta Barat', 16, 'active');

-- Sample cable routes (akan terisi otomatis saat ada customer)
-- INSERT OR IGNORE INTO cable_routes (customer_id, odp_id, cable_length, status, port_number) VALUES 
-- (1, 1, 150.50, 'connected', 1),
-- (2, 1, 200.75, 'connected', 2),
-- (3, 2, 100.25, 'connected', 1);

-- Sample network segments
INSERT OR IGNORE INTO network_segments (name, start_odp_id, end_odp_id, segment_type, cable_length, status) VALUES 
('Backbone-Central-Branch', 1, 2, 'Backbone', 500.00, 'active'),
('Distribution-Branch-Residential', 2, 3, 'Distribution', 300.00, 'active');
