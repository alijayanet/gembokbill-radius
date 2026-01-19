const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path ke database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

// Test function untuk cek data monthly summary
async function testMonthlySummary() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('✅ Database connected successfully');
        });

        // Cek apakah tabel monthly_summary ada
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='monthly_summary'", (err, row) => {
            if (err) {
                console.error('Error checking table:', err);
                reject(err);
                return;
            }

            if (!row) {
                console.log('❌ Tabel monthly_summary tidak ditemukan');
                console.log('💡 Jalankan script setup-monthly-summary.js terlebih dahulu');
                resolve(false);
                return;
            }

            console.log('✅ Tabel monthly_summary ditemukan');

            // Cek data di tabel
            db.all("SELECT * FROM monthly_summary ORDER BY year DESC, month DESC LIMIT 5", (err, rows) => {
                if (err) {
                    console.error('Error querying data:', err);
                    reject(err);
                    return;
                }

                console.log(`📊 Data monthly summary ditemukan: ${rows.length} records`);
                
                if (rows.length > 0) {
                    console.log('\n📋 Sample data:');
                    rows.forEach((row, index) => {
                        console.log(`${index + 1}. ${row.year}-${row.month.toString().padStart(2, '0')}: 
   Total Customers: ${row.total_customers}
   Active Customers: ${row.active_customers}
   Monthly Revenue: Rp ${row.monthly_revenue.toLocaleString('id-ID')}
   Voucher Revenue: Rp ${row.voucher_revenue.toLocaleString('id-ID')}
   Total Revenue: Rp ${row.total_revenue.toLocaleString('id-ID')}
   Created: ${row.created_at}`);
                    });
                } else {
                    console.log('❌ Tidak ada data monthly summary');
                    console.log('💡 Generate summary bulanan terlebih dahulu');
                }

                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('✅ Database connection closed');
                    }
                });

                resolve(rows.length > 0);
            });
        });
    });
}

// Test function untuk generate sample data
async function generateSampleData() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
        });

        // Generate sample data untuk 3 bulan terakhir
        const currentDate = new Date();
        const sampleData = [];

        for (let i = 0; i < 3; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            sampleData.push({
                year: year,
                month: month,
                total_customers: 7 + Math.floor(Math.random() * 3),
                active_customers: 6 + Math.floor(Math.random() * 2),
                monthly_invoices: 5 + Math.floor(Math.random() * 3),
                voucher_invoices: 2 + Math.floor(Math.random() * 2),
                paid_monthly_invoices: 4 + Math.floor(Math.random() * 2),
                paid_voucher_invoices: 1 + Math.floor(Math.random() * 2),
                unpaid_monthly_invoices: 1 + Math.floor(Math.random() * 2),
                unpaid_voucher_invoices: 1 + Math.floor(Math.random() * 2),
                monthly_revenue: 5000000 + Math.floor(Math.random() * 2000000),
                voucher_revenue: 1000000 + Math.floor(Math.random() * 500000),
                monthly_unpaid: 500000 + Math.floor(Math.random() * 300000),
                voucher_unpaid: 200000 + Math.floor(Math.random() * 100000),
                total_revenue: 0, // Will be calculated
                total_unpaid: 0, // Will be calculated
                notes: `Sample data for ${year}-${month.toString().padStart(2, '0')}`,
                created_at: new Date().toISOString()
            });
        }

        // Calculate totals
        sampleData.forEach(data => {
            data.total_revenue = data.monthly_revenue + data.voucher_revenue;
            data.total_unpaid = data.monthly_unpaid + data.voucher_unpaid;
        });

        // Insert sample data
        const insertSQL = `
            INSERT OR REPLACE INTO monthly_summary (
                year, month, total_customers, active_customers,
                monthly_invoices, voucher_invoices,
                paid_monthly_invoices, paid_voucher_invoices,
                unpaid_monthly_invoices, unpaid_voucher_invoices,
                monthly_revenue, voucher_revenue,
                monthly_unpaid, voucher_unpaid,
                total_revenue, total_unpaid, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let completed = 0;
        sampleData.forEach((data, index) => {
            db.run(insertSQL, [
                data.year, data.month, data.total_customers, data.active_customers,
                data.monthly_invoices, data.voucher_invoices,
                data.paid_monthly_invoices, data.paid_voucher_invoices,
                data.unpaid_monthly_invoices, data.unpaid_voucher_invoices,
                data.monthly_revenue, data.voucher_revenue,
                data.monthly_unpaid, data.voucher_unpaid,
                data.total_revenue, data.total_unpaid, data.notes, data.created_at
            ], function(err) {
                if (err) {
                    console.error(`Error inserting data ${index + 1}:`, err);
                } else {
                    console.log(`✅ Sample data ${index + 1} inserted: ${data.year}-${data.month.toString().padStart(2, '0')}`);
                }
                
                completed++;
                if (completed === sampleData.length) {
                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database:', err);
                        } else {
                            console.log('✅ Sample data generation completed');
                        }
                        resolve(true);
                    });
                }
            });
        });
    });
}

// Main function
async function main() {
    console.log('🔍 Testing Monthly Summary Data...\n');
    
    try {
        const hasData = await testMonthlySummary();
        
        if (!hasData) {
            console.log('\n🔄 Generating sample data...');
            await generateSampleData();
            
            console.log('\n🔍 Testing again after sample data generation...');
            await testMonthlySummary();
        }
        
        console.log('\n✅ Test completed!');
        console.log('💡 Sekarang coba refresh halaman /admin/billing/monthly-summary');
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

// Run the test
main();
