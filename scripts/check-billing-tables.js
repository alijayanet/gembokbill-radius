const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../billing.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

async function checkBillingTables() {
    console.log('\n🔍 Checking All Tables for Coordinate Data...\n');
    
    // Get all table names
    const tables = await new Promise((resolve, reject) => {
        db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
    
    console.log('📋 All Tables in Database:');
    tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.name}`);
    });
    
    // Check each table for any data
    for (const table of tables) {
        const tableName = table.name;
        
        console.log(`\n📊 Table "${tableName}":`);
        
        // Get row count
        const count = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log(`  Row count: ${count}`);
        
        if (count > 0) {
            // Get table structure
            const columns = await new Promise((resolve, reject) => {
                db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
            
            console.log(`  Columns: ${columns.map(col => col.name).join(', ')}`);
            
            // Get sample data
            const sampleData = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${tableName} LIMIT 3`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
            
            console.log(`  Sample data:`);
            sampleData.forEach((row, index) => {
                console.log(`    ${index + 1}. ${JSON.stringify(row, null, 2)}`);
            });
        }
    }
    
    // Close database
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('\n✅ Database connection closed');
        }
    });
}

// Run the check
checkBillingTables().catch(console.error);
