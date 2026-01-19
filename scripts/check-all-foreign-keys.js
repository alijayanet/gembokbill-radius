const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

console.log('🔍 Checking all tables for foreign keys to invoices...');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error getting tables:', err.message);
        return;
    }

    tables.forEach(table => {
        db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
            if (err) {
                console.error(`Error checking ${table.name}:`, err.message);
                return;
            }

            // Check for columns that might reference invoices
            const invoiceColumns = columns.filter(col => 
                col.name.includes('invoice') || 
                col.name === 'id' && table.name !== 'invoices'
            );

            if (invoiceColumns.length > 0) {
                console.log(`📋 ${table.name}:`);
                invoiceColumns.forEach(col => {
                    console.log(`   - ${col.name} (${col.type})`);
                });
            }
        });
    });
});

// Check foreign key constraints
setTimeout(() => {
    console.log('\n🔍 Checking foreign key constraints...');
    db.all("PRAGMA foreign_key_list(invoices)", (err, fks) => {
        if (err) {
            console.error('Error checking foreign keys for invoices:', err.message);
        } else {
            console.log('Foreign keys for invoices table:');
            fks.forEach(fk => {
                console.log(`   - ${fk.from} -> ${fk.table}.${fk.to}`);
            });
        }
    });
}, 1000);

// Check for any data that might reference invoices
setTimeout(() => {
    console.log('\n🔍 Checking for data that references invoices...');
    
    // Check if there are any records in other tables that might reference invoices
    const tablesToCheck = ['payments', 'voucher_purchases', 'monthly_summary'];
    
    tablesToCheck.forEach(tableName => {
        db.all(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
            if (err) {
                console.log(`❌ Error checking ${tableName}: ${err.message}`);
            } else {
                console.log(`📊 ${tableName}: ${result[0].count} records`);
            }
        });
    });
}, 2000);

setTimeout(() => db.close(), 3000);
