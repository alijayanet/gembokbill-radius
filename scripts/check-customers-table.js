const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Checking customers table structure...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Get table structure
db.all('PRAGMA table_info(customers)', (err, rows) => {
    if (err) {
        console.error('❌ Error getting table info:', err.message);
    } else {
        console.log('📋 Customers table structure:');
        rows.forEach(row => {
            console.log(`${row.name}: ${row.type} (notnull: ${row.notnull}, pk: ${row.pk})`);
        });
        
        // Check if updated_at column exists
        const hasUpdatedAt = rows.some(row => row.name === 'updated_at');
        console.log(`\n🔍 Has updated_at column: ${hasUpdatedAt}`);
        
        if (!hasUpdatedAt) {
            console.log('⚠️ updated_at column does not exist, will add it');
            
            // Add updated_at column
            db.run('ALTER TABLE customers ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP', (err) => {
                if (err) {
                    console.error('❌ Error adding updated_at column:', err.message);
                } else {
                    console.log('✅ updated_at column added successfully');
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