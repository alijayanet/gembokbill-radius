const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('Checking database at:', dbPath);

// Check if database file exists
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
    console.log('Database file does not exist');
    process.exit(1);
}

console.log('Database file exists');

// Connect to database and list tables
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    
    console.log('Connected to database');
    
    // Get all tables
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, rows) => {
        if (err) {
            console.error('Error querying tables:', err);
            db.close();
            return;
        }
        
        console.log('\nTables in database:');
        if (rows.length === 0) {
            console.log('No tables found');
        } else {
            rows.forEach(row => {
                console.log('- ' + row.name);
            });
        }
        
        // Check if voucher_online_settings table exists
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='voucher_online_settings'`, [], (err, row) => {
            if (err) {
                console.error('Error checking voucher_online_settings table:', err);
                db.close();
                return;
            }
            
            if (row) {
                console.log('\nChecking voucher_online_settings table structure:');
                db.all(`PRAGMA table_info(voucher_online_settings)`, [], (err, columns) => {
                    if (err) {
                        console.error('Error getting table info:', err);
                    } else {
                        console.log('Columns:');
                        columns.forEach(col => {
                            console.log(`- ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
                        });
                    }
                    
                    // Check data in table
                    db.all(`SELECT * FROM voucher_online_settings LIMIT 5`, [], (err, rows) => {
                        if (err) {
                            console.error('Error querying voucher_online_settings:', err);
                        } else {
                            console.log(`\nData in voucher_online_settings (${rows.length} rows):`);
                            rows.forEach(row => {
                                console.log(JSON.stringify(row, null, 2));
                            });
                        }
                        
                        db.close();
                    });
                });
            } else {
                console.log('\nvoucher_online_settings table does not exist');
                db.close();
            }
        });
    });
});