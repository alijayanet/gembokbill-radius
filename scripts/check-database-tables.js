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

async function checkDatabaseTables() {
    console.log('\n🔍 Checking Database Tables...\n');
    
    // Get all table names
    const tables = await new Promise((resolve, reject) => {
        db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
    
    console.log('📋 Available Tables:');
    tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.name}`);
    });
    
    // Check if specific tables exist
    const tableNames = tables.map(t => t.name);
    const requiredTables = ['odps', 'customers', 'cable_routes', 'odp_connections'];
    
    console.log('\n🔍 Required Tables Check:');
    requiredTables.forEach(table => {
        if (tableNames.includes(table)) {
            console.log(`  ✅ ${table} - EXISTS`);
        } else {
            console.log(`  ❌ ${table} - MISSING`);
        }
    });
    
    // Check customers table structure if it exists
    if (tableNames.includes('customers')) {
        console.log('\n👥 Customers Table Structure:');
        const customerColumns = await new Promise((resolve, reject) => {
            db.all(`PRAGMA table_info(customers)`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        customerColumns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        // Check customers data
        const customerCount = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM customers`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log(`\n📊 Customers Data: ${customerCount} records`);
        
        if (customerCount > 0) {
            const sampleCustomers = await new Promise((resolve, reject) => {
                db.all(`SELECT id, name, latitude, longitude, status FROM customers LIMIT 5`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
            
            console.log('Sample customers:');
            sampleCustomers.forEach(customer => {
                console.log(`  - ${customer.name}: [${customer.latitude}, ${customer.longitude}] - ${customer.status}`);
            });
        }
    }
    
    // Check if there are any network-related tables
    const networkTables = tableNames.filter(name => 
        name.includes('odp') || 
        name.includes('cable') || 
        name.includes('network') ||
        name.includes('connection')
    );
    
    if (networkTables.length > 0) {
        console.log('\n🌐 Network-related Tables:');
        networkTables.forEach(table => {
            console.log(`  - ${table}`);
        });
    } else {
        console.log('\n⚠️  No network-related tables found!');
        console.log('This explains why ODPs and ONUs are not showing on the map.');
        console.log('The database only contains billing data, not network infrastructure data.');
    }
    
    // Close database
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('\n✅ Database connection closed');
        }
    });
}

// Run the check
checkDatabaseTables().catch(console.error);
