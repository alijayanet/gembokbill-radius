/**
 * Check Collector Tables Structure
 * Script untuk mengecek struktur tabel collector yang sudah ada
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkCollectorTables() {
    try {
        console.log('🔍 Checking collector tables structure...');
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Check collector_payments table structure
        console.log('\n📊 Collector_payments table structure:');
        const collectorPaymentsColumns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(collector_payments)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        collectorPaymentsColumns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });
        
        // Check collectors table structure
        console.log('\n👥 Collectors table structure:');
        const collectorsColumns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(collectors)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        collectorsColumns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });
        
        // Check collector_assignments table structure
        console.log('\n📋 Collector_assignments table structure:');
        const collectorAssignmentsColumns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(collector_assignments)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        collectorAssignmentsColumns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });
        
        db.close();
        console.log('\n🎉 Collector tables structure check completed!');
        
    } catch (error) {
        console.error('💥 Error checking collector tables:', error);
        process.exit(1);
    }
}

// Run check if called directly
if (require.main === module) {
    checkCollectorTables();
}

module.exports = checkCollectorTables;
