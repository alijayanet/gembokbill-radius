const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking Collector Database Structure...\n');

// Check collectors table schema
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='collectors'", (err, rows) => {
    if (err) {
        console.error('❌ Error:', err);
        return;
    }
    
    if (rows.length > 0) {
        console.log('✅ Collectors Table Schema:');
        console.log(rows[0].sql);
        console.log('\n');
    } else {
        console.log('❌ Collectors table not found');
    }
    
    // Check collector_payments table
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='collector_payments'", (err, rows) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        if (rows.length > 0) {
            console.log('✅ Collector Payments Table Schema:');
            console.log(rows[0].sql);
            console.log('\n');
        } else {
            console.log('❌ Collector payments table not found');
        }
        
        // Check sample data
        db.all("SELECT COUNT(*) as count FROM collectors", (err, rows) => {
            if (err) {
                console.error('❌ Error:', err);
                return;
            }
            
            console.log(`📊 Total Collectors: ${rows[0].count}`);
            
            // Check collector payments count
            db.all("SELECT COUNT(*) as count FROM collector_payments", (err, rows) => {
                if (err) {
                    console.error('❌ Error:', err);
                    return;
                }
                
                console.log(`📊 Total Collector Payments: ${rows[0].count}`);
                
                // Show sample collectors
                db.all("SELECT id, name, phone, status, commission_rate FROM collectors LIMIT 5", (err, rows) => {
                    if (err) {
                        console.error('❌ Error:', err);
                        return;
                    }
                    
                    console.log('\n📋 Sample Collectors:');
                    rows.forEach(collector => {
                        console.log(`- ID: ${collector.id}, Name: ${collector.name}, Phone: ${collector.phone}, Status: ${collector.status}, Commission: ${collector.commission_rate}%`);
                    });
                    
                    db.close();
                    console.log('\n✅ Database check completed!');
                });
            });
        });
    });
});
