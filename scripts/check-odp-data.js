const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../data/billing.db');

console.log('Checking ODP data in database...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    console.log('✅ Database connected successfully');
});

// Check if odps table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='odps'", (err, row) => {
    if (err) {
        console.error('Error checking table:', err);
        return;
    }
    
    if (row) {
        console.log('✅ ODPs table exists');
        
        // Get all ODPs
        db.all("SELECT * FROM odps ORDER BY id", (err, rows) => {
            if (err) {
                console.error('Error fetching ODPs:', err);
                return;
            }
            
            console.log('\n📊 Current ODP data:');
            console.log('Total ODPs:', rows.length);
            
            rows.forEach((odp, index) => {
                console.log(`\n${index + 1}. ID: ${odp.id}`);
                console.log(`   Name: ${odp.name}`);
                console.log(`   Code: ${odp.code}`);
                console.log(`   Latitude: ${odp.latitude}`);
                console.log(`   Longitude: ${odp.longitude}`);
                console.log(`   Address: ${odp.address}`);
                console.log(`   Capacity: ${odp.capacity}`);
                console.log(`   Status: ${odp.status}`);
                console.log(`   Notes: ${odp.notes}`);
                console.log(`   Created: ${odp.created_at}`);
                console.log(`   Updated: ${odp.updated_at}`);
            });
            
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('\n✅ Database connection closed');
                }
            });
        });
    } else {
        console.log('❌ ODPs table does not exist');
        db.close();
    }
});
