const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🧹 Cleaning sample ONU data...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Delete sample data
db.run('DELETE FROM onu_devices WHERE name IN (?, ?, ?)', ['ONU-001', 'ONU-002', 'ONU-003'], function(err) {
    if (err) {
        console.error('❌ Error deleting sample data:', err.message);
    } else {
        console.log(`✅ Deleted ${this.changes} sample ONU devices`);
        
        // Count remaining ONU devices
        db.get('SELECT COUNT(*) as count FROM onu_devices', (err, row) => {
            if (err) {
                console.error('❌ Error counting remaining devices:', err.message);
            } else {
                console.log(`📊 Remaining ONU devices: ${row.count}`);
                
                if (row.count > 0) {
                    console.log('🔍 Checking existing ONU devices...');
                    db.all('SELECT id, name, serial_number, status, latitude, longitude FROM onu_devices', (err, rows) => {
                        if (err) {
                            console.error('❌ Error fetching devices:', err.message);
                        } else {
                            console.log('📋 Existing ONU devices:');
                            rows.forEach((device, index) => {
                                console.log(`${index + 1}. ${device.name} (${device.serial_number}) - ${device.status} at [${device.latitude}, ${device.longitude}]`);
                            });
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
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('✅ Database connection closed');
                        }
                    });
                }
            }
        });
    }
});
