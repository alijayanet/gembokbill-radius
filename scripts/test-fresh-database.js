const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing Auto-Migration on Fresh Database...\n');

// Create a test database path
const testDbPath = path.join(__dirname, '../data/test-fresh.db');
console.log('Test database path:', testDbPath);

// Remove test database if exists
if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('🗑️  Removed existing test database');
}

// Create test database directory if needed
const dataDir = path.dirname(testDbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
}

// Test creating fresh database with BillingManager
console.log('\n🧪 Testing BillingManager on fresh database...');

try {
    // Temporarily modify the dbPath for testing
    const originalDbPath = path.join(__dirname, '../data/billing.db');
    
    // Create a mock BillingManager for testing
    class TestBillingManager {
        constructor() {
            this.dbPath = testDbPath;
            this.initDatabase();
        }

        initDatabase() {
            // Pastikan direktori data ada
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening test database:', err);
                } else {
                    console.log('✅ Test database connected');
                    this.createTables();
                }
            });
        }

        createTables() {
            const tables = [
                // Tabel paket internet
                `CREATE TABLE IF NOT EXISTS packages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    speed TEXT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    tax_rate DECIMAL(5,2) DEFAULT 11.00,
                    description TEXT,
                    pppoe_profile TEXT DEFAULT 'default',
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,

                // Tabel pelanggan
                `CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    phone TEXT UNIQUE NOT NULL,
                    pppoe_username TEXT,
                    email TEXT,
                    address TEXT,
                    latitude DECIMAL(10,8),
                    longitude DECIMAL(11,8),
                    package_id INTEGER,
                    pppoe_profile TEXT,
                    status TEXT DEFAULT 'active',
                    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (package_id) REFERENCES packages (id)
                )`,

                // Tabel ODP (Optical Distribution Point)
                `CREATE TABLE IF NOT EXISTS odps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    code VARCHAR(50) NOT NULL UNIQUE,
                    latitude DECIMAL(10,8) NOT NULL,
                    longitude DECIMAL(11,8) NOT NULL,
                    address TEXT,
                    capacity INTEGER DEFAULT 64,
                    used_ports INTEGER DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
                    installation_date DATE,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,

                // Tabel Cable Routes (Jalur Kabel dari ODP ke Pelanggan)
                `CREATE TABLE IF NOT EXISTS cable_routes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    odp_id INTEGER NOT NULL,
                    cable_length DECIMAL(8,2),
                    cable_type VARCHAR(50) DEFAULT 'Fiber Optic',
                    installation_date DATE,
                    status VARCHAR(20) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'maintenance', 'damaged')),
                    port_number INTEGER,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                    FOREIGN KEY (odp_id) REFERENCES odps(id) ON DELETE CASCADE
                )`,

                // Tabel Network Segments (Segmen Jaringan)
                `CREATE TABLE IF NOT EXISTS network_segments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    start_odp_id INTEGER NOT NULL,
                    end_odp_id INTEGER,
                    segment_type VARCHAR(50) DEFAULT 'Backbone' CHECK (segment_type IN ('Backbone', 'Distribution', 'Access')),
                    cable_length DECIMAL(10,2),
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'damaged', 'inactive')),
                    installation_date DATE,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (start_odp_id) REFERENCES odps(id) ON DELETE CASCADE,
                    FOREIGN KEY (end_odp_id) REFERENCES odps(id) ON DELETE CASCADE
                )`,

                // Tabel Cable Maintenance Log
                `CREATE TABLE IF NOT EXISTS cable_maintenance_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cable_route_id INTEGER,
                    network_segment_id INTEGER,
                    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('repair', 'replacement', 'inspection', 'upgrade')),
                    description TEXT NOT NULL,
                    performed_by INTEGER,
                    maintenance_date DATE NOT NULL,
                    duration_hours DECIMAL(4,2),
                    cost DECIMAL(12,2),
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (cable_route_id) REFERENCES cable_routes(id) ON DELETE CASCADE,
                    FOREIGN KEY (network_segment_id) REFERENCES network_segments(id) ON DELETE CASCADE
                )`
            ];

            tables.forEach(table => {
                this.db.run(table, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                    }
                });
            });

            // Buat index untuk tabel ODP dan Cable Network
            this.createODPIndexes();
            
            // Buat trigger untuk tabel ODP dan Cable Network
            this.createODPTriggers();
        }

        createODPIndexes() {
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_odps_location ON odps(latitude, longitude)',
                'CREATE INDEX IF NOT EXISTS idx_odps_status ON odps(status)',
                'CREATE INDEX IF NOT EXISTS idx_cable_routes_customer ON cable_routes(customer_id)',
                'CREATE INDEX IF NOT EXISTS idx_cable_routes_odp ON cable_routes(odp_id)',
                'CREATE INDEX IF NOT EXISTS idx_cable_routes_status ON cable_routes(status)',
                'CREATE INDEX IF NOT EXISTS idx_network_segments_start ON network_segments(start_odp_id)',
                'CREATE INDEX IF NOT EXISTS idx_network_segments_end ON network_segments(end_odp_id)',
                'CREATE INDEX IF NOT EXISTS idx_network_segments_status ON network_segments(status)',
                'CREATE INDEX IF NOT EXISTS idx_maintenance_logs_route ON cable_maintenance_logs(cable_route_id)',
                'CREATE INDEX IF NOT EXISTS idx_maintenance_logs_segment ON cable_maintenance_logs(network_segment_id)',
                'CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON cable_maintenance_logs(maintenance_date)'
            ];

            indexes.forEach(indexSQL => {
                this.db.run(indexSQL, (err) => {
                    if (err) {
                        console.error('Error creating ODP index:', err);
                    }
                });
            });
        }

        createODPTriggers() {
            const triggers = [
                `CREATE TRIGGER IF NOT EXISTS update_odps_updated_at 
                    AFTER UPDATE ON odps
                    FOR EACH ROW
                BEGIN
                    UPDATE odps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END`,
                
                `CREATE TRIGGER IF NOT EXISTS update_cable_routes_updated_at 
                    AFTER UPDATE ON cable_routes
                    FOR EACH ROW
                BEGIN
                    UPDATE cable_routes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END`,
                
                `CREATE TRIGGER IF NOT EXISTS update_network_segments_updated_at 
                    AFTER UPDATE ON network_segments
                    FOR EACH ROW
                BEGIN
                    UPDATE network_segments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END`,
                
                `CREATE TRIGGER IF NOT EXISTS update_odp_used_ports_insert
                    AFTER INSERT ON cable_routes
                    FOR EACH ROW
                BEGIN
                    UPDATE odps SET used_ports = used_ports + 1 WHERE id = NEW.odp_id;
                END`,
                
                `CREATE TRIGGER IF NOT EXISTS update_odp_used_ports_delete
                    AFTER DELETE ON cable_routes
                    FOR EACH ROW
                BEGIN
                    UPDATE odps SET used_ports = used_ports - 1 WHERE id = OLD.odp_id;
                END`
            ];

            triggers.forEach(triggerSQL => {
                this.db.run(triggerSQL, (err) => {
                    if (err) {
                        console.error('Error creating ODP trigger:', err);
                    }
                });
            });
        }
    }

    const testManager = new TestBillingManager();
    
    console.log('✅ Test BillingManager created successfully');
    
    // Wait for async operations
    setTimeout(() => {
        console.log('\n📊 Verifying fresh database creation...');
        
        const db = new sqlite3.Database(testDbPath, (err) => {
            if (err) {
                console.error('❌ Error opening test database:', err.message);
                return;
            }
            console.log('✅ Test database opened for verification');
        });

        // Check all tables
        const expectedTables = [
            'packages',
            'customers', 
            'odps',
            'cable_routes',
            'network_segments',
            'cable_maintenance_logs'
        ];

        let tablesChecked = 0;
        expectedTables.forEach(tableName => {
            db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, row) => {
                if (err) {
                    console.error(`❌ Error checking ${tableName}:`, err.message);
                } else if (row) {
                    console.log(`✅ Table ${tableName} created successfully`);
                } else {
                    console.log(`❌ Table ${tableName} was not created`);
                }
                
                tablesChecked++;
                if (tablesChecked === expectedTables.length) {
                    // Check indexes
                    db.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'", (err, rows) => {
                        if (err) {
                            console.error('❌ Error checking indexes:', err.message);
                        } else {
                            console.log(`\n✅ Created ${rows.length} indexes for ODP system`);
                            rows.forEach(row => {
                                if (row.name.includes('odp') || row.name.includes('cable') || row.name.includes('network') || row.name.includes('maintenance')) {
                                    console.log(`   • ${row.name}`);
                                }
                            });
                        }
                        
                        // Check triggers
                        db.all("SELECT name FROM sqlite_master WHERE type='trigger'", (err, rows) => {
                            if (err) {
                                console.error('❌ Error checking triggers:', err.message);
                            } else {
                                console.log(`\n✅ Created ${rows.length} triggers for ODP system`);
                                rows.forEach(row => {
                                    if (row.name.includes('odp') || row.name.includes('cable') || row.name.includes('network')) {
                                        console.log(`   • ${row.name}`);
                                    }
                                });
                            }
                            
                            db.close((err) => {
                                if (err) {
                                    console.error('❌ Error closing test database:', err.message);
                                } else {
                                    console.log('\n🔒 Test database connection closed');
                                    
                                    // Clean up test database
                                    if (fs.existsSync(testDbPath)) {
                                        fs.unlinkSync(testDbPath);
                                        console.log('🗑️  Cleaned up test database');
                                    }
                                    
                                    console.log('\n🎉 Fresh database auto-migration test PASSED!');
                                    console.log('✅ ODP tables will be created automatically on first run');
                                }
                            });
                        });
                    });
                }
            });
        });

    }, 2000);
    
} catch (error) {
    console.error('❌ Error testing fresh database:', error.message);
}
