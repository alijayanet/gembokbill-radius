const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Checking customer santo...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Check customer santo
db.get('SELECT id, name, pppoe_username, latitude, longitude FROM customers WHERE pppoe_username = ?', ['santo'], (err, row) => {
    if (err) {
        console.error('❌ Error querying customer:', err.message);
    } else if (row) {
        console.log('✅ Customer santo found:');
        console.log(JSON.stringify(row, null, 2));
        
        if (row.latitude && row.longitude) {
            console.log('✅ Customer has coordinates:', row.latitude, row.longitude);
        } else {
            console.log('❌ Customer has no coordinates');
        }
    } else {
        console.log('❌ Customer santo not found');
    }
    
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
    });
});
