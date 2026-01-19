#!/usr/bin/env node

/**
 * Script untuk setup monthly summary
 * Menjalankan migration dan generate summary pertama
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Path ke database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('📊 Setting up monthly summary system...\n');

// Baca migration file
const migrationPath = path.join(__dirname, '..', 'migrations', 'create_monthly_summary_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

// Jalankan migration
console.log('⏳ Running migration...');
db.exec(migrationSQL, (err) => {
    if (err) {
        console.error('❌ Migration failed:', err.message);
        db.close();
        process.exit(1);
    }
    
    console.log('✅ Migration completed successfully');
    
    // Generate summary untuk bulan ini
    generateCurrentMonthSummary();
});

function generateCurrentMonthSummary() {
    console.log('\n📈 Generating summary for current month...');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Get current stats
    const statsQueries = [
        { name: 'Total Customers', query: 'SELECT COUNT(*) as count FROM customers' },
        { name: 'Active Customers', query: 'SELECT COUNT(*) as count FROM customers WHERE status = "active"' },
        { name: 'Monthly Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "monthly"' },
        { name: 'Voucher Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "voucher"' },
        { name: 'Paid Monthly Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "monthly" AND status = "paid"' },
        { name: 'Paid Voucher Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "voucher" AND status = "paid"' },
        { name: 'Unpaid Monthly Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "monthly" AND status = "unpaid"' },
        { name: 'Unpaid Voucher Invoices', query: 'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = "voucher" AND status = "unpaid"' },
        { name: 'Monthly Revenue', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE invoice_type = "monthly" AND status = "paid"' },
        { name: 'Voucher Revenue', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE invoice_type = "voucher" AND status = "paid"' },
        { name: 'Monthly Unpaid', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE invoice_type = "monthly" AND status = "unpaid"' },
        { name: 'Voucher Unpaid', query: 'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE invoice_type = "voucher" AND status = "unpaid"' }
    ];
    
    let stats = {};
    let completed = 0;
    
    statsQueries.forEach((stat, index) => {
        db.get(stat.query, [], (err, row) => {
            if (err) {
                console.error(`❌ Error getting ${stat.name}:`, err.message);
            } else {
                const value = stat.name.includes('Revenue') || stat.name.includes('Unpaid') 
                    ? parseFloat(row.total) || 0 
                    : parseInt(row.count) || 0;
                
                // Map to stats object
                switch(stat.name) {
                    case 'Total Customers': stats.total_customers = value; break;
                    case 'Active Customers': stats.active_customers = value; break;
                    case 'Monthly Invoices': stats.monthly_invoices = value; break;
                    case 'Voucher Invoices': stats.voucher_invoices = value; break;
                    case 'Paid Monthly Invoices': stats.paid_monthly_invoices = value; break;
                    case 'Paid Voucher Invoices': stats.paid_voucher_invoices = value; break;
                    case 'Unpaid Monthly Invoices': stats.unpaid_monthly_invoices = value; break;
                    case 'Unpaid Voucher Invoices': stats.unpaid_voucher_invoices = value; break;
                    case 'Monthly Revenue': stats.monthly_revenue = value; break;
                    case 'Voucher Revenue': stats.voucher_revenue = value; break;
                    case 'Monthly Unpaid': stats.monthly_unpaid = value; break;
                    case 'Voucher Unpaid': stats.voucher_unpaid = value; break;
                }
                
                console.log(`   ${stat.name}: ${value}`);
            }
            
            completed++;
            if (completed === statsQueries.length) {
                // Calculate totals
                stats.total_revenue = stats.monthly_revenue + stats.voucher_revenue;
                stats.total_unpaid = stats.monthly_unpaid + stats.voucher_unpaid;
                
                // Save to monthly summary
                saveMonthlySummary(year, month, stats);
            }
        });
    });
}

function saveMonthlySummary(year, month, stats) {
    const sql = `
        INSERT OR REPLACE INTO monthly_summary (
            year, month, total_customers, active_customers,
            monthly_invoices, voucher_invoices,
            paid_monthly_invoices, paid_voucher_invoices,
            unpaid_monthly_invoices, unpaid_voucher_invoices,
            monthly_revenue, voucher_revenue,
            monthly_unpaid, voucher_unpaid,
            total_revenue, total_unpaid, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const notes = `Initial summary generated on ${new Date().toISOString().split('T')[0]}`;
    const params = [
        year, month,
        stats.total_customers || 0,
        stats.active_customers || 0,
        stats.monthly_invoices || 0,
        stats.voucher_invoices || 0,
        stats.paid_monthly_invoices || 0,
        stats.paid_voucher_invoices || 0,
        stats.unpaid_monthly_invoices || 0,
        stats.unpaid_voucher_invoices || 0,
        stats.monthly_revenue || 0,
        stats.voucher_revenue || 0,
        stats.monthly_unpaid || 0,
        stats.voucher_unpaid || 0,
        stats.total_revenue || 0,
        stats.total_unpaid || 0,
        notes
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('❌ Error saving monthly summary:', err.message);
            db.close();
            process.exit(1);
        }
        
        console.log(`\n✅ Monthly summary saved for ${year}-${month}`);
        console.log(`   - Total Revenue: Rp ${stats.total_revenue.toLocaleString('id-ID')}`);
        console.log(`   - Total Customers: ${stats.total_customers}`);
        console.log(`   - Monthly Invoices: ${stats.monthly_invoices}`);
        console.log(`   - Voucher Invoices: ${stats.voucher_invoices}`);
        
        console.log('\n🎉 Monthly summary system setup completed!');
        console.log('\n📋 Next steps:');
        console.log('   1. Summary akan otomatis di-generate setiap tanggal 1 pukul 23:59');
        console.log('   2. Akses halaman summary di /admin/billing/monthly-summary');
        console.log('   3. Summary akan disimpan sebagai catatan keuangan permanen');
        
        db.close();
        process.exit(0);
    });
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⚠️  Process interrupted');
    db.close();
    process.exit(0);
});
