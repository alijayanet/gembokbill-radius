const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing database connection and ODP data...\n');

// Database path
const dbPath = path.join(__dirname, '../data/billing.db');
console.log('Database path:', dbPath);

// Check if database file exists
if (fs.existsSync(dbPath)) {
    console.log('✅ Database file exists');
} else {
    console.log('❌ Database file does not exist');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected successfully');
});

// Check ODPs table
db.all("SELECT * FROM odps", (err, rows) => {
    if (err) {
        console.error('❌ Error querying ODPs:', err.message);
        db.close();
        return;
    }
    
    console.log(`\n📊 Found ${rows.length} ODPs in database:`);
    
    if (rows.length === 0) {
        console.log('⚠️  No ODPs found in database');
    } else {
        rows.forEach((odp, index) => {
            console.log(`\n${index + 1}. ${odp.name} (ID: ${odp.id})`);
            console.log(`   📍 ${odp.latitude}, ${odp.longitude}`);
            console.log(`   📝 ${odp.address || 'No address'}`);
            console.log(`   🔧 Status: ${odp.status}`);
            console.log(`   📅 Updated: ${odp.updated_at}`);
        });
    }
    
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('\n✅ Database connection closed');
        }
    });
});
