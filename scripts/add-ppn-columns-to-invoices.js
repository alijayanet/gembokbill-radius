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

// Fungsi untuk menambahkan kolom PPN ke tabel invoices
function addPPNColumnsToInvoices() {
    return new Promise((resolve, reject) => {
        console.log('🔍 Checking invoices table structure...');
        
        // Cek struktur tabel invoices
        db.all("PRAGMA table_info(invoices)", (err, columns) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('📊 Current invoices table structure:');
            columns.forEach(col => {
                console.log(`  - ${col.name}: ${col.type} - ${col.notnull ? 'REQUIRED' : 'OPTIONAL'}`);
            });
            
            const hasBaseAmount = columns.some(col => col.name === 'base_amount');
            const hasTaxRate = columns.some(col => col.name === 'tax_rate');
            
            console.log('\n📋 PPN columns status:');
            console.log(`  - base_amount: ${hasBaseAmount ? '✅ EXISTS' : '❌ MISSING'}`);
            console.log(`  - tax_rate: ${hasTaxRate ? '✅ EXISTS' : '❌ MISSING'}`);
            
            if (hasBaseAmount && hasTaxRate) {
                console.log('\n✅ All PPN columns already exist!');
                resolve();
                return;
            }
            
            // Tambahkan kolom yang belum ada
            const columnsToAdd = [];
            if (!hasBaseAmount) columnsToAdd.push('base_amount');
            if (!hasTaxRate) columnsToAdd.push('tax_rate');
            
            console.log(`\n🔄 Adding missing columns: ${columnsToAdd.join(', ')}`);
            
            let completed = 0;
            const totalColumns = columnsToAdd.length;
            
            columnsToAdd.forEach(columnName => {
                let sql, params;
                
                if (columnName === 'base_amount') {
                    sql = "ALTER TABLE invoices ADD COLUMN base_amount DECIMAL(10,2)";
                } else if (columnName === 'tax_rate') {
                    sql = "ALTER TABLE invoices ADD COLUMN tax_rate DECIMAL(5,2)";
                }
                
                db.run(sql, (err) => {
                    if (err) {
                        console.error(`❌ Error adding ${columnName}:`, err.message);
                    } else {
                        console.log(`✅ Successfully added ${columnName} column`);
                    }
                    
                    completed++;
                    if (completed === totalColumns) {
                        // Update existing invoices dengan data PPN
                        updateExistingInvoices();
                    }
                });
            });
        });
    });
}

// Fungsi untuk update existing invoices dengan data PPN
function updateExistingInvoices() {
    console.log('\n🔄 Updating existing invoices with PPN data...');
    
    // Get all invoices that don't have base_amount or tax_rate
    const sql = `
        SELECT i.id, i.amount, p.price as package_price, p.tax_rate as package_tax_rate
        FROM invoices i
        JOIN packages p ON i.package_id = p.id
        WHERE i.base_amount IS NULL OR i.tax_rate IS NULL
    `;
    
    db.all(sql, [], (err, invoices) => {
        if (err) {
            console.error('❌ Error fetching invoices:', err.message);
            return;
        }
        
        if (invoices.length === 0) {
            console.log('✅ No invoices need updating');
            showFinalStructure();
            return;
        }
        
        console.log(`📋 Found ${invoices.length} invoices to update`);
        
        let updated = 0;
        invoices.forEach(invoice => {
            const baseAmount = invoice.package_price;
            const taxRate = invoice.package_tax_rate || 11.00;
            
            const updateSql = `
                UPDATE invoices 
                SET base_amount = ?, tax_rate = ? 
                WHERE id = ?
            `;
            
            db.run(updateSql, [baseAmount, taxRate, invoice.id], function(err) {
                if (err) {
                    console.error(`❌ Error updating invoice ${invoice.id}:`, err.message);
                } else {
                    console.log(`✅ Updated invoice ${invoice.id}: base_amount=${baseAmount}, tax_rate=${taxRate}%`);
                }
                
                updated++;
                if (updated === invoices.length) {
                    console.log('\n✅ All invoices updated successfully!');
                    showFinalStructure();
                }
            });
        });
    });
}

// Fungsi untuk menampilkan struktur tabel akhir
function showFinalStructure() {
    console.log('\n📊 Final invoices table structure:');
    
    db.all("PRAGMA table_info(invoices)", (err, columns) => {
        if (err) {
            console.error('❌ Error getting final structure:', err.message);
            return;
        }
        
        columns.forEach(col => {
            const required = col.notnull ? 'REQUIRED' : 'OPTIONAL';
            const defaultValue = col.dflt_value ? ` (Default: ${col.dflt_value})` : '';
            console.log(`  - ${col.name}: ${col.type} - ${required}${defaultValue}`);
        });
        
        console.log('\n🎉 PPN columns added successfully!');
        console.log('\n📝 Summary:');
        console.log('  ✅ base_amount column added (DECIMAL(10,2))');
        console.log('  ✅ tax_rate column added (DECIMAL(5,2))');
        console.log('  ✅ Existing invoices updated with PPN data');
        console.log('\n🚀 Next steps:');
        console.log('  1. Update invoice print templates to show PPN breakdown');
        console.log('  2. Test invoice generation with PPN calculation');
        console.log('  3. Verify PPN display in printed invoices');
        
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('\n🔒 Database connection closed');
            }
        });
    });
}

// Jalankan script
if (require.main === module) {
    addPPNColumnsToInvoices()
        .then(() => {
            console.log('\n🎯 Script completed successfully!');
        })
        .catch(error => {
            console.error('\n💥 Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { addPPNColumnsToInvoices };
