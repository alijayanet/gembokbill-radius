#!/usr/bin/env node

/**
 * Script untuk menjalankan migration invoice_type
 * Memisahkan invoice voucher dengan invoice pelanggan bulanan
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Path ke database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔧 Memulai migration invoice_type...\n');

// Baca migration file
const migrationPath = path.join(__dirname, '..', 'migrations', 'add_invoice_type_column.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

// Jalankan migration
console.log('⏳ Menjalankan migration...');
db.exec(migrationSQL, (err) => {
    if (err) {
        console.error('❌ Migration failed:', err.message);
        db.close();
        process.exit(1);
    }
    
    console.log('✅ Migration completed successfully');
    
    // Tampilkan statistik setelah migration
    showStats();
});

function showStats() {
    console.log('\n📊 Statistik setelah migration:');
    
    const statsQueries = [
        { name: 'Total Invoices', query: 'SELECT COUNT(*) as count FROM invoices' },
        { name: 'Monthly Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "monthly"' },
        { name: 'Voucher Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "voucher"' },
        { name: 'Manual Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "manual"' },
        { name: 'Monthly Revenue', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE invoice_type = "monthly" AND status = "paid"' },
        { name: 'Voucher Revenue', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE invoice_type = "voucher" AND status = "paid"' }
    ];
    
    let statsCompleted = 0;
    
    statsQueries.forEach((stat, index) => {
        db.get(stat.query, [], (err, row) => {
            if (err) {
                console.error(`❌ Error getting ${stat.name}:`, err.message);
            } else {
                const value = stat.name.includes('Revenue') 
                    ? `Rp ${(row.total || 0).toLocaleString('id-ID')}` 
                    : row.count || 0;
                console.log(`   ${stat.name}: ${value}`);
            }
            
            statsCompleted++;
            if (statsCompleted === statsQueries.length) {
                console.log('\n✅ Migration selesai! Invoice sekarang terpisah berdasarkan type.');
                console.log('\n📋 Invoice Types:');
                console.log('   - monthly: Tagihan pelanggan bulanan');
                console.log('   - voucher: Tagihan pembelian voucher online');
                console.log('   - manual: Tagihan manual (jika ada)');
                db.close();
                process.exit(0);
            }
        });
    });
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⚠️  Process interrupted');
    db.close();
    process.exit(0);
});
