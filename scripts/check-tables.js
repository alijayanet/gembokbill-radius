const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Checking database tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error('❌ Error getting tables:', err.message);
    } else {
        console.log('📋 All tables in database:');
        rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
        });
        
        // Check for ONU/device related tables
        const onuTables = rows.filter(row => 
            row.name.toLowerCase().includes('onu') || 
            row.name.toLowerCase().includes('device') ||
            row.name.toLowerCase().includes('router') ||
            row.name.toLowerCase().includes('equipment')
        );
        
        if (onuTables.length > 0) {
            console.log('\n🔍 ONU/Device related tables:');
            onuTables.forEach((table, index) => {
                console.log(`${index + 1}. ${table.name}`);
            });
        } else {
            console.log('\n❌ No ONU/Device related tables found');
        }
        
        // Check if there are any tables with data that might contain ONU info
        console.log('\n🔍 Checking tables for potential ONU data...');
        let checkedTables = 0;
        const totalTables = rows.length;
        
        rows.forEach(row => {
            db.get(`SELECT COUNT(*) as count FROM ${row.name}`, (err, countRow) => {
                if (err) {
                    // Table might not exist or have issues
                } else {
                    if (countRow.count > 0) {
                        console.log(`📊 ${row.name}: ${countRow.count} records`);
                    }
                }
                
                checkedTables++;
                if (checkedTables === totalTables) {
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('✅ Database connection closed');
                        }
                    });
                }
            });
        });
    }
});