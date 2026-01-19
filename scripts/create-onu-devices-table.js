const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🚀 Creating ONU Devices Table...');

// Read migration file
const migrationPath = path.join(__dirname, '..', 'migrations', 'create_onu_devices_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Execute migration
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Execute the migration
db.exec(migrationSQL, (err) => {
    if (err) {
        console.error('❌ Error executing migration:', err.message);
    } else {
        console.log('✅ ONU devices table created successfully');
        
        // Verify the table was created
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='onu_devices'", (err, row) => {
            if (err) {
                console.error('❌ Error verifying table:', err.message);
            } else if (row) {
                console.log('✅ Table onu_devices exists');
                
                // Count records
                db.get("SELECT COUNT(*) as count FROM onu_devices", (err, row) => {
                    if (err) {
                        console.error('❌ Error counting records:', err.message);
                    } else {
                        console.log(`✅ Found ${row.count} ONU devices in database`);
                    }
                    
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('✅ Database connection closed');
                        }
                    });
                });
            } else {
                console.log('❌ Table onu_devices does not exist');
            }
        });
    }
});
