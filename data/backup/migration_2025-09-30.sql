
-- Migration script untuk server
-- Generated: 2025-09-30T05:41:15.438Z

-- 1. Backup database saat ini
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- 2. Insert customers jika belum ada

INSERT OR IGNORE INTO customers (
    id, username, name, phone, email, address, package_id, status,
    pppoe_username, latitude, longitude, auto_suspension, billing_day, join_date
) VALUES (
    7, 'cust_7890_447089_7lou', 'Test Customer 1', '', '', '', 1, 'active',
    'cust_7890_447089_7lou', -6.2088, 106.8456, 1, 15, '2025-09-30'
);

INSERT OR IGNORE INTO customers (
    id, username, name, phone, email, address, package_id, status,
    pppoe_username, latitude, longitude, auto_suspension, billing_day, join_date
) VALUES (
    8, 'cust_7891_447155_1oqx', 'Test Customer 2', '', '', '', 2, 'active',
    'cust_7891_447155_1oqx', -6.2088, 106.8456, 1, 15, '2025-09-30'
);

INSERT OR IGNORE INTO customers (
    id, username, name, phone, email, address, package_id, status,
    pppoe_username, latitude, longitude, auto_suspension, billing_day, join_date
) VALUES (
    9, 'cust_0111_447204_y91g', 'santo@gembok.com', '', '', '', 7, 'active',
    'cust_0111_447204_y91g', -6.2088, 106.8456, 1, 15, '2025-09-30'
);

-- 3. Update packages jika perlu

INSERT OR IGNORE INTO packages (id, name, price) VALUES (1, 'Paket Internet Dasar', 100000);

INSERT OR IGNORE INTO packages (id, name, price) VALUES (2, 'Paket Internet Standard', 150000);

INSERT OR IGNORE INTO packages (id, name, price) VALUES (3, 'Paket Internet Premium', 250000);

INSERT OR IGNORE INTO packages (id, name, price) VALUES (4, 'BRONZE', 110000);

INSERT OR IGNORE INTO packages (id, name, price) VALUES (7, 'SOSIAL', 60000);

INSERT OR IGNORE INTO packages (id, name, price) VALUES (16, 'testing', 70000);

INSERT OR IGNORE INTO packages (id, name, price) VALUES (17, 'nyoba', 65000);

INSERT OR IGNORE INTO packages (id, name, price) VALUES (19, 'nyoba2', 65000);

-- 4. Update technicians jika perlu

INSERT OR IGNORE INTO technicians (id, name, phone) VALUES (1, 'Administrator', '081234567891');

INSERT OR IGNORE INTO technicians (id, name, phone) VALUES (2, 'Teknisi 6656', '62838076656');

INSERT OR IGNORE INTO technicians (id, name, phone) VALUES (3, 'Teknisi 0947', '62822180947');

INSERT OR IGNORE INTO technicians (id, name, phone) VALUES (124, 'Teknisi 6xxx', '62838076656xxx');

INSERT OR IGNORE INTO technicians (id, name, phone) VALUES (125, 'Teknisi 7xxx', '62822180947xxx');

-- 5. Update ODPs jika perlu

INSERT OR IGNORE INTO odps (id, name, code, capacity, used_ports, status) VALUES (4, 'ODP-SERVER', 'ODP01', 64, 0, 'active');

INSERT OR IGNORE INTO odps (id, name, code, capacity, used_ports, status) VALUES (5, 'ODP-KAPRAN', 'ODP02', 64, 0, 'active');

INSERT OR IGNORE INTO odps (id, name, code, capacity, used_ports, status) VALUES (8, 'TIANG-KESIN', 'T01', 0, 0, 'active');
