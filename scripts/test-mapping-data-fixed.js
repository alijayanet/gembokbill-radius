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

async function testMappingData() {
    console.log('\n🔍 Testing Mapping Data (Fixed)...\n');
    
    // Test ODPs data
    console.log('📊 ODPs Data:');
    const odps = await new Promise((resolve, reject) => {
        db.all(`
            SELECT o.id, o.name, o.code, o.capacity, o.used_ports, o.status,
                   o.latitude, o.longitude, o.address, o.notes
            FROM odps o
            WHERE o.latitude IS NOT NULL AND o.longitude IS NOT NULL
            ORDER BY o.name
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
    
    console.log(`Found ${odps.length} ODPs with coordinates:`);
    odps.forEach((odp, index) => {
        console.log(`  ${index + 1}. ${odp.name} (${odp.code}) - [${odp.latitude}, ${odp.longitude}] - Status: ${odp.status}`);
    });
    
    // Test Customers data
    console.log('\n👥 Customers Data:');
    const customers = await new Promise((resolve, reject) => {
        db.all(`
            SELECT c.id, c.name, c.phone, c.email, c.address, c.latitude, c.longitude,
                   c.pppoe_username, c.status, c.package_id, c.odp_id,
                   o.name as odp_name
            FROM customers c
            LEFT JOIN odps o ON c.odp_id = o.id
            WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
            ORDER BY c.name
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
    
    console.log(`Found ${customers.length} Customers with coordinates:`);
    customers.forEach((customer, index) => {
        console.log(`  ${index + 1}. ${customer.name} - [${customer.latitude}, ${customer.longitude}] - Status: ${customer.status} - PPPoE: ${customer.pppoe_username}`);
    });
    
    // Test Cable Routes data
    console.log('\n🔌 Cable Routes Data:');
    const cables = await new Promise((resolve, reject) => {
        db.all(`
            SELECT c.id, c.customer_id, c.odp_id, c.cable_length, c.cable_type,
                   c.status, c.port_number, c.notes,
                   o.name as odp_name, o.latitude as odp_lat, o.longitude as odp_lng,
                   cust.name as customer_name, cust.latitude as customer_lat, cust.longitude as customer_lng
            FROM cable_routes c
            LEFT JOIN odps o ON c.odp_id = o.id
            LEFT JOIN customers cust ON c.customer_id = cust.id
            WHERE o.latitude IS NOT NULL AND o.longitude IS NOT NULL
              AND cust.latitude IS NOT NULL AND cust.longitude IS NOT NULL
            ORDER BY c.id
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
    
    console.log(`Found ${cables.length} Cable Routes:`);
    cables.forEach((cable, index) => {
        console.log(`  ${index + 1}. ${cable.odp_name} → ${cable.customer_name} - Length: ${cable.cable_length}m - Status: ${cable.status}`);
    });
    
    // Test ODP Connections data
    console.log('\n🌐 ODP Connections Data:');
    const connections = await new Promise((resolve, reject) => {
        db.all(`
            SELECT oc.id, CONCAT('ODP-', oc.from_odp_id, '-', oc.to_odp_id) as name, 
                   oc.from_odp_id, oc.to_odp_id, oc.connection_type, oc.cable_length,
                   oc.status, oc.cable_capacity, oc.notes,
                   o1.name as start_odp_name, o1.latitude as start_lat, o1.longitude as start_lng,
                   o2.name as end_odp_name, o2.latitude as end_lat, o2.longitude as end_lng
            FROM odp_connections oc
            LEFT JOIN odps o1 ON oc.from_odp_id = o1.id
            LEFT JOIN odps o2 ON oc.to_odp_id = o2.id
            WHERE o1.latitude IS NOT NULL AND o1.longitude IS NOT NULL
              AND o2.latitude IS NOT NULL AND o2.longitude IS NOT NULL
            ORDER BY oc.id
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
    
    console.log(`Found ${connections.length} ODP Connections:`);
    connections.forEach((connection, index) => {
        console.log(`  ${index + 1}. ${connection.start_odp_name} → ${connection.end_odp_name} - Length: ${connection.cable_length}m - Status: ${connection.status}`);
    });
    
    // Summary
    console.log('\n📈 Summary:');
    console.log(`- ODPs with coordinates: ${odps.length}`);
    console.log(`- Customers with coordinates: ${customers.length}`);
    console.log(`- Cable routes: ${cables.length}`);
    console.log(`- ODP connections: ${connections.length}`);
    
    if (odps.length > 0 && customers.length > 0) {
        console.log('\n✅ SUCCESS: Network infrastructure data is ready!');
        console.log('The technician mapping should now show ODPs and ONUs on the map.');
    } else {
        console.log('\n⚠️  WARNING: Still missing network data!');
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

// Run the test
testMappingData().catch(console.error);
