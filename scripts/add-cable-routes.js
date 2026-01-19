const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔌 Adding cable routes...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Get customers and ODPs to create cable routes
db.all(`
    SELECT c.id as customer_id, c.name as customer_name, c.latitude as customer_lat, c.longitude as customer_lng, c.odp_id,
           o.name as odp_name, o.latitude as odp_lat, o.longitude as odp_lng
    FROM customers c
    LEFT JOIN odps o ON c.odp_id = o.id
    WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      AND o.latitude IS NOT NULL AND o.longitude IS NOT NULL
`, (err, rows) => {
    if (err) {
        console.error('❌ Error getting customers and ODPs:', err.message);
        db.close();
        return;
    }
    
    console.log(`📊 Found ${rows.length} customers with ODP connections`);
    
    if (rows.length === 0) {
        console.log('❌ No customers with ODP connections found');
        db.close();
        return;
    }
    
    let insertedCount = 0;
    let errorCount = 0;
    
    rows.forEach((row, index) => {
        // Calculate cable length (simple distance calculation)
        const lat1 = row.customer_lat;
        const lng1 = row.customer_lng;
        const lat2 = row.odp_lat;
        const lng2 = row.odp_lng;
        
        // Simple distance calculation (not accurate but good enough for demo)
        const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 111000; // Rough conversion to meters
        
        const cableData = {
            customer_id: row.customer_id,
            odp_id: row.odp_id,
            cable_length: Math.round(distance),
            cable_type: 'Fiber Optic',
            status: 'active',
            port_number: index + 1,
            notes: `Cable from ${row.odp_name} to ${row.customer_name}`
        };
        
        const sql = `INSERT OR IGNORE INTO cable_routes (
            customer_id, odp_id, cable_length, cable_type, status, port_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            cableData.customer_id,
            cableData.odp_id,
            cableData.cable_length,
            cableData.cable_type,
            cableData.status,
            cableData.port_number,
            cableData.notes
        ];
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error(`❌ Error inserting cable for ${row.customer_name}:`, err.message);
                errorCount++;
            } else {
                console.log(`✅ Cable route created: ${row.odp_name} → ${row.customer_name} (${cableData.cable_length}m)`);
                insertedCount++;
            }
            
            // Check if all cables have been processed
            if (index === rows.length - 1) {
                console.log(`\n📊 Summary: ${insertedCount} cables inserted, ${errorCount} errors`);
                
                // Count total cable routes
                db.get("SELECT COUNT(*) as count FROM cable_routes", (err, row) => {
                    if (err) {
                        console.error('❌ Error counting cable routes:', err.message);
                    } else {
                        console.log(`✅ Total cable routes in database: ${row.count}`);
                    }
                    
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('✅ Database connection closed');
                        }
                    });
                });
            }
        });
    });
});
