#!/usr/bin/env node

/**
 * CLEAR ALL TRANSACTIONS SCRIPT
 * Script untuk menghapus SEMUA data transaksi tanpa membuat data default
 * 
 * Script ini akan:
 * 1. Menghapus semua data transaksi (customers, invoices, payments, agents, vouchers, dll)
 * 2. Reset semua counter dan sequence
 * 3. Menjaga struktur database dan settings yang penting
 * 
 * HATI-HATI: Script ini akan menghapus SEMUA DATA TRANSAKSI!
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function clearAllTransactions() {
    const dbPath = path.join(__dirname, '../data/billing.db');
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🚨 CLEAR ALL TRANSACTIONS - HAPUS SEMUA DATA TRANSAKSI!');
        console.log('=' .repeat(70));
        console.log('⚠️  Script ini akan menghapus SEMUA data transaksi');
        console.log('⚠️  SEMUA CUSTOMERS, INVOICES, PAYMENTS, AGENTS, VOUCHERS akan DIHAPUS!');
        console.log('⚠️  Struktur database dan settings akan dipertahankan');
        console.log('=' .repeat(70));
        
        // Confirmation prompt
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise((resolve) => {
            rl.question('Ketik "CLEAR ALL" untuk konfirmasi (case sensitive): ', (input) => {
                rl.close();
                resolve(input);
            });
        });
        
        if (answer !== 'CLEAR ALL') {
            console.log('❌ Penghapusan dibatalkan. Tidak ada data yang dimodifikasi.');
            process.exit(0);
        }
        
        console.log('\n🔄 Memulai penghapusan data transaksi...');
        
        // Step 1: Get all table names
        console.log('\n📋 Step 1: Mengidentifikasi tabel transaksi...');
        const tables = await new Promise((resolve, reject) => {
            db.all(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.name));
            });
        });
        
        console.log(`✅ Ditemukan ${tables.length} tabel`);
        
        // Step 2: Get current data counts
        console.log('\n📊 Step 2: Mencatat data yang akan dihapus...');
        const dataCounts = {};
        
        for (const table of tables) {
            try {
                const count = await new Promise((resolve, reject) => {
                    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                        if (err) resolve(0);
                        else resolve(row ? row.count : 0);
                    });
                });
                dataCounts[table] = count;
                if (count > 0) {
                    console.log(`   📊 ${table}: ${count} records`);
                }
            } catch (error) {
                dataCounts[table] = 0;
            }
        }
        
        const totalRecords = Object.values(dataCounts).reduce((a, b) => a + b, 0);
        console.log(`\n📈 Total records yang akan dihapus: ${totalRecords}`);
        
        // Step 3: Delete all transaction data
        console.log('\n🗑️  Step 3: Menghapus semua data transaksi...');
        
        // Define deletion order to respect foreign key constraints
        const deletionOrder = [
            // Agent related tables
            'agent_voucher_sales',
            'agent_balances',
            'agent_notifications',
            'agent_transactions',
            'agent_monthly_payments',
            'agents',
            
            // Voucher related tables
            'voucher_invoices',
            
            // Payment related tables
            'collector_payments',
            'payments',
            'collectors',
            
            // Invoice and customer tables
            'invoices',
            'customers',
            
            // Package tables
            'packages',
            'technicians',
            'expenses'
        ];
        
        for (const table of deletionOrder) {
            if (tables.includes(table)) {
                try {
                    await new Promise((resolve, reject) => {
                        db.run(`DELETE FROM ${table}`, (err) => {
                            if (err) {
                                console.error(`   ❌ Error deleting ${table}:`, err.message);
                                reject(err);
                            } else {
                                console.log(`   ✅ ${table}: cleared`);
                                resolve();
                            }
                        });
                    });
                } catch (error) {
                    console.log(`   ⚠️  ${table}: ${error.message}`);
                }
            }
        }
        
        // Step 4: Reset auto-increment sequences
        console.log('\n🔄 Step 4: Reset auto-increment sequences...');
        await new Promise((resolve) => {
            db.run(`DELETE FROM sqlite_sequence`, (err) => {
                if (err) {
                    console.log('   ⚠️  Could not reset sequences:', err.message);
                } else {
                    console.log('   ✅ All sequences reset to start from 1');
                }
                resolve();
            });
        });
        
        // Step 5: Vacuum database
        console.log('\n🧹 Step 5: Optimasi database...');
        await new Promise((resolve) => {
            db.run(`VACUUM`, (err) => {
                if (err) {
                    console.log('   ⚠️  Could not vacuum database:', err.message);
                } else {
                    console.log('   ✅ Database optimized');
                }
                resolve();
            });
        });
        
        // Step 6: Final verification
        console.log('\n📊 Step 6: Verifikasi akhir...');
        const finalStats = {};
        
        for (const table of tables) {
            try {
                const count = await new Promise((resolve, reject) => {
                    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                        if (err) resolve(0);
                        else resolve(row ? row.count : 0);
                    });
                });
                finalStats[table] = count;
                if (count > 0) {
                    console.log(`   📊 ${table}: ${count} records`);
                }
            } catch (error) {
                finalStats[table] = 0;
            }
        }
        
        // Step 7: Summary
        console.log('\n🎉 DATA TRANSAKSI BERHASIL DIHAPUS!');
        console.log('=' .repeat(70));
        console.log('📋 SUMMARY:');
        console.log(`   📅 Clear Date: ${new Date().toISOString()}`);
        console.log(`   🗑️  Data Deleted: ${totalRecords} records`);
        console.log(`   📊 Remaining Data: ${Object.values(finalStats).reduce((a, b) => a + b, 0)} records`);
        console.log('');
        console.log('✅ Yang dipertahankan:');
        console.log('   🔧 Database structure');
        console.log('   ⚙️  App settings');
        console.log('   🔧 System settings');
        console.log('   🎫 Voucher pricing (jika ada)');
        console.log('');
        console.log('✅ Yang dihapus:');
        console.log('   👥 All customers');
        console.log('   📄 All invoices');
        console.log('   💰 All payments');
        console.log('   👤 All agents');
        console.log('   🎫 All agent voucher sales');
        console.log('   💳 All collector payments');
        console.log('   📦 All packages');
        console.log('   🔧 All technicians');
        console.log('   💸 All expenses');
        console.log('');
        console.log('🚀 Database siap untuk data transaksi baru!');
        console.log('=' .repeat(70));
        
        console.log('\n📋 Next Steps:');
        console.log('   1. ✅ Database sudah bersih dari data transaksi');
        console.log('   2. 🔄 Restart aplikasi jika diperlukan');
        console.log('   3. 📦 Setup packages baru jika diperlukan');
        console.log('   4. 👤 Setup agents baru jika diperlukan');
        console.log('   5. 🎯 Ready untuk transaksi baru!');
        
    } catch (error) {
        console.error('❌ Error during transaction clearing:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Run if called directly
if (require.main === module) {
    clearAllTransactions()
        .then(() => {
            console.log('\n✅ All transactions cleared successfully!');
            console.log('🚀 Database is ready for new transactions!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Transaction clearing failed:', error);
            process.exit(1);
        });
}

module.exports = clearAllTransactions;
