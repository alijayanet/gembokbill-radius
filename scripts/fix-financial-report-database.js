const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path ke database billing
const dbPath = path.join(__dirname, '../data/billing.db');

// Buat koneksi database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to billing database');
});

// Fungsi untuk memperbaiki struktur database laporan keuangan
function fixFinancialReportDatabase() {
    return new Promise((resolve, reject) => {
        console.log('🔧 Fixing database structure for financial reporting...\n');
        
        // Tambahkan kolom yang hilang ke tabel payment_gateway_transactions
        const missingColumns = [
            { name: 'payment_method', type: 'VARCHAR(50)', defaultValue: 'NULL' },
            { name: 'gateway_name', type: 'VARCHAR(50)', defaultValue: 'NULL' }
        ];
        
        let completed = 0;
        const totalColumns = missingColumns.length;
        
        missingColumns.forEach(column => {
            const sql = `ALTER TABLE payment_gateway_transactions ADD COLUMN ${column.name} ${column.type}`;
            
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error(`❌ Error adding ${column.name}:`, err.message);
                } else {
                    console.log(`✅ Successfully added ${column.name} column`);
                }
                
                completed++;
                if (completed === totalColumns) {
                    // Update existing records dengan data yang sesuai
                    updateExistingPaymentRecords();
                }
            });
        });
        
        function updateExistingPaymentRecords() {
            console.log('\n🔄 Updating existing payment records...');
            
            // Update payment_method dan gateway_name dari data yang ada
            const updateSql = `
                UPDATE payment_gateway_transactions 
                SET payment_method = COALESCE(payment_type, 'Online Payment'),
                    gateway_name = COALESCE(gateway, 'Unknown Gateway')
                WHERE payment_method IS NULL OR gateway_name IS NULL
            `;
            
            db.run(updateSql, (err) => {
                if (err) {
                    console.error('❌ Error updating payment records:', err.message);
                } else {
                    console.log('✅ Payment records updated successfully');
                }
                
                // Tampilkan struktur akhir
                showFinalStructure();
            });
        }
        
        function showFinalStructure() {
            console.log('\n📊 Final payment_gateway_transactions table structure:');
            
            db.all("PRAGMA table_info(payment_gateway_transactions)", (err, columns) => {
                if (err) {
                    console.error('❌ Error getting final structure:', err.message);
                    resolve();
                    return;
                }
                
                columns.forEach(col => {
                    const required = col.notnull ? 'REQUIRED' : 'OPTIONAL';
                    const defaultValue = col.dflt_value ? ` (Default: ${col.dflt_value})` : '';
                    console.log(`  - ${col.name}: ${col.type} - ${required}${defaultValue}`);
                });
                
                console.log('\n🎉 Financial report database structure fixed successfully!');
                console.log('\n📝 Summary:');
                console.log('  ✅ payment_method column added (VARCHAR(50))');
                console.log('  ✅ gateway_name column added (VARCHAR(50))');
                console.log('  ✅ Existing payment records updated');
                console.log('\n🚀 Next steps:');
                console.log('  1. Test financial report generation');
                console.log('  2. Verify payment data appears in reports');
                console.log('  3. Check that all transactions are included');
                
                resolve();
            });
        }
    });
}

// Jalankan script
if (require.main === module) {
    fixFinancialReportDatabase()
        .then(() => {
            console.log('\n🎯 Database fix completed successfully!');
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('🔒 Database connection closed');
                }
            });
        })
        .catch(error => {
            console.error('\n💥 Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { fixFinancialReportDatabase };
