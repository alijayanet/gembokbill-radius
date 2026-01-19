/**
 * Setup Collectors System
 * Script untuk membuat tabel dan data tukang tagih
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function setupCollectorsSystem() {
    try {
        console.log('🚀 Setting up collectors system...');
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/create_collectors_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration
        console.log('📋 Running database migration...');
        db.exec(migrationSQL, (err) => {
            if (err) {
                console.error('❌ Migration failed:', err);
                throw err;
            }
            console.log('✅ Database migration completed');
        });
        
        // Verify tables created
        console.log('🔍 Verifying tables...');
        const tables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%collector%'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        console.log('📊 Created tables:');
        tables.forEach(table => {
            console.log(`  ✅ ${table.name}`);
        });
        
        // Check sample data
        const collectors = await new Promise((resolve, reject) => {
            db.all("SELECT COUNT(*) as count FROM collectors", (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0].count);
            });
        });
        
        console.log(`👥 Sample collectors created: ${collectors}`);
        
        db.close();
        console.log('🎉 Collectors system setup completed successfully!');
        
    } catch (error) {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    setupCollectorsSystem();
}

module.exports = setupCollectorsSystem;
