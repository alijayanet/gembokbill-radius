const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔌 Adding simple cable route...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Insert simple cable route
const sql = `INSERT INTO cable_routes (
    customer_id, odp_id, cable_length, cable_type, status, port_number, notes
) VALUES (?, ?, ?, ?, ?, ?, ?)`;

const params = [
    3, // customer_id (santo)
    1, // odp_id (ODP-KAPRAN)
    200, // cable_length in meters
    'Fiber Optic', // cable_type
    'connected', // status (valid: connected, disconnected, maintenance, damaged)
    1, // port_number
    'Cable from ODP-KAPRAN to santo' // notes
];

db.run(sql, params, function(err) {
    if (err) {
        console.error('❌ Error inserting cable route:', err.message);
    } else {
        console.log(`✅ Cable route inserted successfully, ID: ${this.lastID}`);
    }
    
    // Check if cable was inserted
    db.get('SELECT COUNT(*) as count FROM cable_routes', (err, row) => {
        if (err) {
            console.error('❌ Error counting cable routes:', err.message);
        } else {
            console.log(`📊 Total cable routes: ${row.count}`);
        }
        
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed');
            }
        });
    });
});
