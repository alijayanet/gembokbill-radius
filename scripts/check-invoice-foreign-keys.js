const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

console.log('🔍 Checking tables with foreign keys to invoices...');

// Check payments table
db.all("PRAGMA table_info(payments)", (err, columns) => {
    if (err) {
        console.error('Error checking payments:', err.message);
    } else {
        console.log('📋 payments table:');
        columns.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
        });
    }
});

// Check voucher_purchases table
db.all("PRAGMA table_info(voucher_purchases)", (err, columns) => {
    if (err) {
        console.error('Error checking voucher_purchases:', err.message);
    } else {
        console.log('📋 voucher_purchases table:');
        columns.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
        });
    }
});

// Check if there are any payments for invoices
db.all("SELECT COUNT(*) as count FROM payments", (err, result) => {
    if (err) {
        console.error('Error checking payments count:', err.message);
    } else {
        console.log(`💰 Total payments: ${result[0].count}`);
    }
});

// Check if there are any voucher purchases for invoices
db.all("SELECT COUNT(*) as count FROM voucher_purchases", (err, result) => {
    if (err) {
        console.error('Error checking voucher_purchases count:', err.message);
    } else {
        console.log(`🎫 Total voucher purchases: ${result[0].count}`);
    }
});

setTimeout(() => db.close(), 2000);
