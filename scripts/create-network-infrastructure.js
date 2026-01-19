const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../billing.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

async function createNetworkInfrastructure() {
    console.log('\n🏗️ Creating Network Infrastructure Tables...\n');
    
    // Create ODPs table
    console.log('📊 Creating ODPs table...');
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS odps (
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
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Create Customers table (if not exists)
    console.log('👥 Creating Customers table...');
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                email VARCHAR(100),
                address TEXT,
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                pppoe_username VARCHAR(50),
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
                package_id INTEGER,
                odp_id INTEGER,
                installation_date DATE,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Create Cable Routes table
    console.log('🔌 Creating Cable Routes table...');
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS cable_routes (
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
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    // Create ODP Connections table
    console.log('🌐 Creating ODP Connections table...');
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS odp_connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_odp_id INTEGER NOT NULL,
                to_odp_id INTEGER NOT NULL,
                connection_type VARCHAR(50) DEFAULT 'fiber' CHECK (connection_type IN ('fiber', 'copper', 'wireless', 'microwave')),
                cable_length DECIMAL(8,2),
                cable_capacity VARCHAR(20) DEFAULT '1G' CHECK (cable_capacity IN ('100M', '1G', '10G', '100G')),
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive', 'damaged')),
                installation_date DATE,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_odp_id) REFERENCES odps(id) ON DELETE CASCADE,
                FOREIGN KEY (to_odp_id) REFERENCES odps(id) ON DELETE CASCADE,
                UNIQUE(from_odp_id, to_odp_id)
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    console.log('✅ All network infrastructure tables created!');
    
    // Insert sample ODP data
    console.log('\n📊 Inserting sample ODP data...');
    const sampleODPs = [
        {
            name: 'ODP-001',
            code: 'ODP001',
            latitude: -6.2088,
            longitude: 106.8456,
            address: 'Jl. Sudirman No. 1, Jakarta Pusat',
            capacity: 64,
            used_ports: 32,
            status: 'active'
        },
        {
            name: 'ODP-002',
            code: 'ODP002',
            latitude: -6.2146,
            longitude: 106.8451,
            address: 'Jl. Thamrin No. 10, Jakarta Pusat',
            capacity: 48,
            used_ports: 24,
            status: 'active'
        },
        {
            name: 'ODP-003',
            code: 'ODP003',
            latitude: -6.2000,
            longitude: 106.8500,
            address: 'Jl. Gatot Subroto No. 5, Jakarta Selatan',
            capacity: 32,
            used_ports: 16,
            status: 'active'
        },
        {
            name: 'ODP-004',
            code: 'ODP004',
            latitude: -6.1900,
            longitude: 106.8400,
            address: 'Jl. HR Rasuna Said No. 15, Jakarta Selatan',
            capacity: 48,
            used_ports: 30,
            status: 'maintenance'
        },
        {
            name: 'ODP-005',
            code: 'ODP005',
            latitude: -6.2200,
            longitude: 106.8300,
            address: 'Jl. Kuningan No. 20, Jakarta Selatan',
            capacity: 64,
            used_ports: 45,
            status: 'active'
        }
    ];
    
    for (const odp of sampleODPs) {
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO odps (name, code, latitude, longitude, address, capacity, used_ports, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [odp.name, odp.code, odp.latitude, odp.longitude, odp.address, odp.capacity, odp.used_ports, odp.status], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    console.log(`✅ Inserted ${sampleODPs.length} sample ODPs`);
    
    // Insert sample Customer data
    console.log('\n👥 Inserting sample Customer data...');
    const sampleCustomers = [
        {
            name: 'John Doe',
            phone: '081234567890',
            email: 'john@example.com',
            address: 'Jl. Sudirman No. 100, Jakarta Pusat',
            latitude: -6.2080,
            longitude: 106.8460,
            pppoe_username: 'john.doe',
            status: 'active',
            odp_id: 1
        },
        {
            name: 'Jane Smith',
            phone: '081234567891',
            email: 'jane@example.com',
            address: 'Jl. Thamrin No. 200, Jakarta Pusat',
            latitude: -6.2140,
            longitude: 106.8455,
            pppoe_username: 'jane.smith',
            status: 'active',
            odp_id: 2
        },
        {
            name: 'Bob Johnson',
            phone: '081234567892',
            email: 'bob@example.com',
            address: 'Jl. Gatot Subroto No. 300, Jakarta Selatan',
            latitude: -6.2005,
            longitude: 106.8505,
            pppoe_username: 'bob.johnson',
            status: 'active',
            odp_id: 3
        },
        {
            name: 'Alice Brown',
            phone: '081234567893',
            email: 'alice@example.com',
            address: 'Jl. HR Rasuna Said No. 400, Jakarta Selatan',
            latitude: -6.1905,
            longitude: 106.8405,
            pppoe_username: 'alice.brown',
            status: 'inactive',
            odp_id: 4
        },
        {
            name: 'Charlie Wilson',
            phone: '081234567894',
            email: 'charlie@example.com',
            address: 'Jl. Kuningan No. 500, Jakarta Selatan',
            latitude: -6.2205,
            longitude: 106.8305,
            pppoe_username: 'charlie.wilson',
            status: 'active',
            odp_id: 5
        }
    ];
    
    for (const customer of sampleCustomers) {
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO customers (name, phone, email, address, latitude, longitude, pppoe_username, status, odp_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [customer.name, customer.phone, customer.email, customer.address, customer.latitude, customer.longitude, customer.pppoe_username, customer.status, customer.odp_id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    console.log(`✅ Inserted ${sampleCustomers.length} sample customers`);
    
    // Insert sample Cable Routes data
    console.log('\n🔌 Inserting sample Cable Routes data...');
    const sampleCables = [
        { customer_id: 1, odp_id: 1, cable_length: 150.5, cable_type: 'Fiber Optic', status: 'connected', port_number: 1 },
        { customer_id: 2, odp_id: 2, cable_length: 200.0, cable_type: 'Fiber Optic', status: 'connected', port_number: 2 },
        { customer_id: 3, odp_id: 3, cable_length: 175.3, cable_type: 'Fiber Optic', status: 'connected', port_number: 1 },
        { customer_id: 4, odp_id: 4, cable_length: 120.8, cable_type: 'Fiber Optic', status: 'disconnected', port_number: 3 },
        { customer_id: 5, odp_id: 5, cable_length: 300.2, cable_type: 'Fiber Optic', status: 'connected', port_number: 2 }
    ];
    
    for (const cable of sampleCables) {
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO cable_routes (customer_id, odp_id, cable_length, cable_type, status, port_number)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [cable.customer_id, cable.odp_id, cable.cable_length, cable.cable_type, cable.status, cable.port_number], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    console.log(`✅ Inserted ${sampleCables.length} sample cable routes`);
    
    // Insert sample ODP Connections data
    console.log('\n🌐 Inserting sample ODP Connections data...');
    const sampleConnections = [
        { from_odp_id: 1, to_odp_id: 2, connection_type: 'fiber', cable_length: 500.0, cable_capacity: '1G', status: 'active' },
        { from_odp_id: 2, to_odp_id: 3, connection_type: 'fiber', cable_length: 800.5, cable_capacity: '1G', status: 'active' },
        { from_odp_id: 3, to_odp_id: 4, connection_type: 'fiber', cable_length: 1200.0, cable_capacity: '10G', status: 'active' },
        { from_odp_id: 4, to_odp_id: 5, connection_type: 'fiber', cable_length: 600.8, cable_capacity: '1G', status: 'maintenance' }
    ];
    
    for (const connection of sampleConnections) {
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO odp_connections (from_odp_id, to_odp_id, connection_type, cable_length, cable_capacity, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [connection.from_odp_id, connection.to_odp_id, connection.connection_type, connection.cable_length, connection.cable_capacity, connection.status], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    console.log(`✅ Inserted ${sampleConnections.length} sample ODP connections`);
    
    // Verify data
    console.log('\n📊 Verifying created data...');
    const odpCount = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM odps', (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });
    
    const customerCount = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM customers', (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });
    
    const cableCount = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM cable_routes', (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });
    
    const connectionCount = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM odp_connections', (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });
    
    console.log(`✅ Data Summary:`);
    console.log(`  - ODPs: ${odpCount}`);
    console.log(`  - Customers: ${customerCount}`);
    console.log(`  - Cable Routes: ${cableCount}`);
    console.log(`  - ODP Connections: ${connectionCount}`);
    
    console.log('\n🎉 Network infrastructure created successfully!');
    console.log('Now the technician mapping should show ODPs and ONUs on the map.');
    
    // Close database
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('\n✅ Database connection closed');
        }
    });
}

// Run the creation
createNetworkInfrastructure().catch(console.error);
