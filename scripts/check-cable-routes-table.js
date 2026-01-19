const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Checking cable_routes table structure...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Get table structure
db.all('PRAGMA table_info(cable_routes)', (err, rows) => {
    if (err) {
        console.error('❌ Error getting table info:', err.message);
    } else {
        console.log('📋 Cable routes table structure:');
        rows.forEach(row => {
            console.log(`${row.name}: ${row.type} (notnull: ${row.notnull}, pk: ${row.pk})`);
        });
        
        // Check if table has data
        db.get('SELECT COUNT(*) as count FROM cable_routes', (err, row) => {
            if (err) {
                console.error('❌ Error counting cable routes:', err.message);
            } else {
                console.log(`\n📊 Cable routes count: ${row.count}`);
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
