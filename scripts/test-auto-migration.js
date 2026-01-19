const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing Auto-Migration for ODP Tables...\n');

// Database path
const dbPath = path.join(__dirname, '../data/billing.db');
console.log('Database path:', dbPath);

// Check if database file exists
if (fs.existsSync(dbPath)) {
    console.log('✅ Database file exists');
} else {
    console.log('❌ Database file does not exist - will be created on first run');
}

// Test BillingManager auto-migration
console.log('\n🧪 Testing BillingManager auto-migration...');

try {
    const billingManager = require('../config/billing.js');
    
    console.log('✅ BillingManager loaded successfully');
    console.log('✅ Auto-migration should run on database connection');
    
    // Wait a bit for async operations to complete
    setTimeout(() => {
        console.log('\n📊 Checking if ODP tables were created...');
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                return;
            }
            console.log('✅ Database connected for verification');
        });

        // Check if ODP tables exist
        const checkTables = [
            'odps',
            'cable_routes', 
            'network_segments',
            'cable_maintenance_logs'
        ];

        let tablesChecked = 0;
        checkTables.forEach(tableName => {
            db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, row) => {
                if (err) {
                    console.error(`❌ Error checking ${tableName}:`, err.message);
                } else if (row) {
                    console.log(`✅ Table ${tableName} exists`);
                } else {
                    console.log(`❌ Table ${tableName} does not exist`);
                }
                
                tablesChecked++;
                if (tablesChecked === checkTables.length) {
                    // Check indexes
                    console.log('\n🔍 Checking indexes...');
                    db.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'", (err, rows) => {
                        if (err) {
                            console.error('❌ Error checking indexes:', err.message);
                        } else {
                            console.log(`✅ Found ${rows.length} indexes:`);
                            rows.forEach(row => {
                                if (row.name.includes('odp') || row.name.includes('cable') || row.name.includes('network') || row.name.includes('maintenance')) {
                                    console.log(`   • ${row.name}`);
                                }
                            });
                        }
                        
                        // Check triggers
                        console.log('\n🔍 Checking triggers...');
                        db.all("SELECT name FROM sqlite_master WHERE type='trigger'", (err, rows) => {
                            if (err) {
                                console.error('❌ Error checking triggers:', err.message);
                            } else {
                                console.log(`✅ Found ${rows.length} triggers:`);
                                rows.forEach(row => {
                                    if (row.name.includes('odp') || row.name.includes('cable') || row.name.includes('network')) {
                                        console.log(`   • ${row.name}`);
                                    }
                                });
                            }
                            
                            db.close((err) => {
                                if (err) {
                                    console.error('❌ Error closing database:', err.message);
                                } else {
                                    console.log('\n🔒 Database connection closed');
                                    console.log('\n🎉 Auto-migration test completed!');
                                }
                            });
                        });
                    });
                }
            });
        });

    }, 2000); // Wait 2 seconds for async operations
    
} catch (error) {
    console.error('❌ Error testing auto-migration:', error.message);
}
