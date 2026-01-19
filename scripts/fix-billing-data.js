#!/usr/bin/env node

/**
 * Script untuk memperbaiki data konsistensi billing
 * Menjalankan cleanup data duplikat dan memperbaiki status yang tidak valid
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path ke database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔧 Memulai perbaikan data konsistensi billing...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

// Query untuk cleanup data
const cleanupQueries = [
    {
        name: 'Hapus duplikat customers berdasarkan phone',
        query: `DELETE FROM customers 
                WHERE id NOT IN (
                    SELECT MAX(id) 
                    FROM customers 
                    GROUP BY phone
                )`
    },
    {
        name: 'Update status customers yang tidak valid',
        query: `UPDATE customers 
                SET status = 'inactive' 
                WHERE status NOT IN ('active', 'inactive', 'suspended')`
    },
    {
        name: 'Update status invoices yang tidak valid',
        query: `UPDATE invoices 
                SET status = 'unpaid' 
                WHERE status NOT IN ('paid', 'unpaid', 'cancelled')`
    },
    {
        name: 'Perbaiki amount invoice yang null atau negatif',
        query: `UPDATE invoices 
                SET amount = 0 
                WHERE amount IS NULL OR amount < 0`
    },
    {
        name: 'Hapus invoices yang tidak memiliki customer',
        query: `DELETE FROM invoices 
                WHERE customer_id NOT IN (SELECT id FROM customers)`
    }
];

// Jalankan cleanup queries
let completed = 0;
const total = cleanupQueries.length;

cleanupQueries.forEach((item, index) => {
    console.log(`⏳ ${index + 1}/${total} - ${item.name}...`);
    
    db.run(item.query, [], function(err) {
        if (err) {
            console.error(`❌ Error: ${err.message}`);
        } else {
            console.log(`✅ Berhasil: ${this.changes} records affected`);
        }
        
        completed++;
        if (completed === total) {
            // Tampilkan statistik setelah cleanup
            showStats();
        }
    });
});

function showStats() {
    console.log('\n📊 Statistik setelah cleanup:');
    
    const statsQueries = [
        { name: 'Total Customers', query: 'SELECT COUNT(*) as count FROM customers' },
        { name: 'Active Customers', query: 'SELECT COUNT(*) as count FROM customers WHERE status = "active"' },
        { name: 'Total Invoices', query: 'SELECT COUNT(*) as count FROM invoices' },
        { name: 'Paid Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE status = "paid"' },
        { name: 'Unpaid Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE status = "unpaid"' },
        { name: 'Total Revenue', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = "paid"' },
        { name: 'Total Unpaid', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = "unpaid"' }
    ];
    
    let statsCompleted = 0;
    
    statsQueries.forEach((stat, index) => {
        db.get(stat.query, [], (err, row) => {
            if (err) {
                console.error(`❌ Error getting ${stat.name}:`, err.message);
            } else {
                const value = stat.name.includes('Revenue') || stat.name.includes('Unpaid') 
                    ? `Rp ${(row.total || 0).toLocaleString('id-ID')}` 
                    : row.count || 0;
                console.log(`   ${stat.name}: ${value}`);
            }
            
            statsCompleted++;
            if (statsCompleted === statsQueries.length) {
                console.log('\n✅ Perbaikan data selesai!');
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
