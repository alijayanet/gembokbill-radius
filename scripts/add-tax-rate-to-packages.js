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
    console.log('Connected to billing database');
});

// Fungsi untuk menambahkan kolom tax_rate
function addTaxRateColumn() {
    return new Promise((resolve, reject) => {
        // Cek apakah kolom tax_rate sudah ada
        db.get("PRAGMA table_info(packages)", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Cek apakah kolom tax_rate sudah ada
            db.all("PRAGMA table_info(packages)", (err, columns) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const hasTaxRate = columns.some(col => col.name === 'tax_rate');
                
                if (hasTaxRate) {
                    console.log('✅ Kolom tax_rate sudah ada di tabel packages');
                    resolve();
                    return;
                }
                
                // Tambahkan kolom tax_rate
                db.run("ALTER TABLE packages ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 11.00", (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    console.log('✅ Berhasil menambahkan kolom tax_rate ke tabel packages');
                    
                    // Update semua paket yang sudah ada dengan nilai default PPN 11%
                    db.run("UPDATE packages SET tax_rate = 11.00 WHERE tax_rate IS NULL", (err) => {
                        if (err) {
                            console.log('⚠️ Warning: Gagal update nilai default PPN:', err.message);
                        } else {
                            console.log('✅ Berhasil update nilai default PPN untuk semua paket');
                        }
                        resolve();
                    });
                });
            });
        });
    });
}

// Fungsi untuk menampilkan struktur tabel packages
function showTableStructure() {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(packages)", (err, columns) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('\n📋 Struktur Tabel Packages:');
            console.log('┌─────────────────┬─────────────┬─────────────┬─────────┬─────────┐');
            console.log('│ Nama Kolom     │ Tipe Data  │ Not Null   │ Default │ Primary │');
            console.log('├─────────────────┼─────────────┼─────────────┼─────────┼─────────┤');
            
            columns.forEach(col => {
                const notNull = col.notnull ? 'YES' : 'NO';
                const primary = col.pk ? 'YES' : 'NO';
                const defaultValue = col.dflt_value || 'NULL';
                
                console.log(`│ ${col.name.padEnd(15)} │ ${col.type.padEnd(11)} │ ${notNull.padEnd(11)} │ ${defaultValue.toString().padEnd(7)} │ ${primary.padEnd(7)} │`);
            });
            
            console.log('└─────────────────┴─────────────┴─────────────┴─────────┴─────────┘');
            resolve();
        });
    });
}

// Fungsi untuk menampilkan data paket
function showPackagesData() {
    return new Promise((resolve, reject) => {
        db.all("SELECT id, name, price, tax_rate FROM packages LIMIT 5", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('\n📦 Data Paket (Sample):');
            console.log('┌────┬─────────────────┬─────────────┬─────────────┬─────────────────────┐');
            console.log('│ ID │ Nama Paket     │ Harga      │ PPN (%)    │ Harga + PPN        │');
            console.log('├────┼─────────────────┼─────────────┼─────────────┼─────────────────────┤');
            
            rows.forEach(row => {
                const price = parseFloat(row.price);
                const taxRate = parseFloat(row.tax_rate || 11);
                const priceWithTax = price * (1 + taxRate / 100);
                
                console.log(`│ ${row.id.toString().padEnd(2)} │ ${row.name.padEnd(15)} │ Rp ${price.toLocaleString('id-ID').padEnd(9)} │ ${taxRate.toFixed(2).padEnd(9)}% │ Rp ${priceWithTax.toFixed(0).toLocaleString('id-ID').padEnd(15)} │`);
            });
            
            console.log('└────┴─────────────────┴─────────────┴─────────────┴─────────────────────┘');
            resolve();
        });
    });
}

// Main execution
async function main() {
    try {
        console.log('🚀 Memulai migrasi database untuk fitur PPN...\n');
        
        // Tambahkan kolom tax_rate
        await addTaxRateColumn();
        
        // Tampilkan struktur tabel
        await showTableStructure();
        
        // Tampilkan data sample
        await showPackagesData();
        
        console.log('\n✅ Migrasi database selesai! Fitur PPN sudah siap digunakan.');
        console.log('\n📝 Catatan:');
        console.log('   • Semua paket yang sudah ada akan menggunakan PPN default 11%');
        console.log('   • Admin dapat mengubah nilai PPN per paket melalui form edit');
        console.log('   • Pengaturan PPN global tersedia di Admin Settings');
        
    } catch (error) {
        console.error('❌ Error selama migrasi:', error.message);
        process.exit(1);
    } finally {
        // Tutup koneksi database
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('\n🔒 Database connection closed');
            }
        });
    }
}

// Jalankan script
if (require.main === module) {
    main();
}

module.exports = { addTaxRateColumn, showTableStructure, showPackagesData };
